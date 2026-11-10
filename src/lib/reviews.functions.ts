import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isTrialExpired } from "./plans";
import { activePlatforms, isPublicRating, DEFAULT_SMS_TEMPLATE } from "./routing";

export const createReviewRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      businessId: z.string().uuid(),
      name: z.string().trim().min(1).max(100),
      phone: z.string().trim().regex(/^\+?[0-9 ()-]{6,20}$/).optional().or(z.literal("")),
      email: z.string().trim().email().max(255).optional().or(z.literal("")),
      channel: z.enum(["sms", "email", "both"]).default("sms"),
    }).refine((v) => (v.channel === "email" || v.phone) && (v.channel === "sms" || v.email), { message: "MISSING_CONTACT" }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: role } = await context.supabase.rpc("member_role", { _business_id: data.businessId, _user_id: context.userId });
    if (!role) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: bizPlan } = await supabaseAdmin.from("businesses").select("plan, created_at").eq("id", data.businessId).single();
    if (bizPlan && isTrialExpired(bizPlan.plan, bizPlan.created_at)) throw new Error("TRIAL_EXPIRED");
    const phone = data.phone ? toE164(data.phone) : "";
    const email = data.email || null;
    const { data: row, error } = await supabaseAdmin
      .from("review_requests")
      .insert({ business_id: data.businessId, customer_name: data.name, customer_phone: phone, customer_email: email, channel: data.channel, created_by: context.userId, status: "created" })
      .select("id, token")
      .single();
    if (error) throw new Error(error.message);
    if (phone) {
      await supabaseAdmin.from("customers").upsert(
        { business_id: data.businessId, name: data.name, phone, ...(email ? { email } : {}), last_requested_at: new Date().toISOString() },
        { onConflict: "business_id,phone" },
      );
    }

    const { data: biz } = await supabaseAdmin.from("businesses").select("name").eq("id", data.businessId).single();
    const link = `${new URL(getRequest().url).origin}/r/${row.token}`;
    const firstName = data.name.split(" ")[0] ?? data.name;
    const errors: string[] = [];

    let emailStatus: "sent" | "failed" | "skipped" = "skipped";
    if (data.channel !== "sms" && email) {
      try {
        const { sendEmail, reviewInviteEmail } = await import("./email.server");
        const id = await sendEmail({ to: email, fromName: biz?.name, ...reviewInviteEmail({ firstName, business: biz?.name ?? "", link }) });
        await supabaseAdmin.from("review_requests").update({ status: "sent", email_id: id }).eq("id", row.id);
        emailStatus = "sent";
      } catch (e) {
        emailStatus = "failed";
        errors.push((e as Error).message);
      }
    }

    let sms: "sent" | "failed" | "no_credits" | "skipped" = "skipped";
    if (data.channel !== "email" && phone) {
      const { data: ok } = await supabaseAdmin.rpc("consume_sms_credit", { _business_id: data.businessId });
      if (!ok) sms = "no_credits";
      else {
        try {
          const { sendSms, renderSms } = await import("./sms.server");
          const sid = await sendSms(phone, renderSms(DEFAULT_SMS_TEMPLATE, { naam: firstName, bedrijf: biz?.name ?? "", link }));
          await supabaseAdmin.from("review_requests").update({ status: "sent", twilio_sid: sid }).eq("id", row.id);
          sms = "sent";
        } catch (e) {
          await supabaseAdmin.rpc("refund_sms_credit", { _business_id: data.businessId });
          sms = "failed";
          errors.push((e as Error).message);
        }
      }
    }

    const anySent = sms === "sent" || emailStatus === "sent";
    if (!anySent) {
      await supabaseAdmin.from("review_requests").update({ status: "failed", error: (sms === "no_credits" ? "NO_CREDITS " : "") + errors.join(" | ").slice(0, 500) }).eq("id", row.id);
    }
    return { token: row.token, sms, email: emailStatus, error: errors.join(" | ") || null };
  });

export const getReview = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ token: z.string().regex(/^[a-f0-9]{32}$/) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: r } = await supabaseAdmin
      .from("review_requests")
      .select("id, customer_name, status, rating, opened_at, businesses(name, google_url, google_enabled, trustpilot_url, trustpilot_enabled, facebook_url, facebook_enabled)")
      .eq("token", data.token)
      .maybeSingle();
    if (!r || !r.businesses) return null;
    if (!r.opened_at) {
      await supabaseAdmin.from("review_requests").update({ opened_at: new Date().toISOString(), status: r.rating ? r.status : "opened" }).eq("id", r.id);
    }
    return {
      firstName: r.customer_name.split(" ")[0],
      business: r.businesses.name,
      rated: r.rating != null,
      platforms: activePlatforms(r.businesses),
    };
  });

export const submitRating = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ token: z.string().regex(/^[a-f0-9]{32}$/), rating: z.number().int().min(1).max(5), feedback: z.string().max(2000).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: r } = await supabaseAdmin
      .from("review_requests")
      .select("id, rating, customer_name, customer_phone, customer_email, business_id, businesses(name, owner_id, google_url, google_enabled, trustpilot_url, trustpilot_enabled, facebook_url, facebook_enabled)")
      .eq("token", data.token)
      .maybeSingle();
    if (!r || !r.businesses) throw new Error("Not found");
    const pub = isPublicRating(data.rating);
    const target = pub ? activePlatforms(r.businesses)[0] : undefined;
    if (r.rating == null) {
      await supabaseAdmin.from("review_requests").update({
        rating: data.rating,
        feedback: data.feedback ?? null,
        status: pub ? "redirected" : "intercepted",
        platform: target?.key ?? null,
        rated_at: new Date().toISOString(),
      }).eq("id", r.id);
    } else if (!pub && data.feedback) {
      await supabaseAdmin.from("review_requests").update({ feedback: data.feedback }).eq("id", r.id).eq("rating", data.rating);
    }
    if (!pub && data.feedback) {
      try {
        const { data: owner } = await supabaseAdmin.from("profiles").select("email").eq("id", r.businesses.owner_id).maybeSingle();
        if (owner?.email) {
          const { sendEmail, negativeFeedbackEmail } = await import("./email.server");
          await sendEmail({
            to: owner.email,
            replyTo: r.customer_email ?? undefined,
            ...negativeFeedbackEmail({
              business: r.businesses.name, customer: r.customer_name, phone: r.customer_phone, email: r.customer_email,
              rating: data.rating, feedback: data.feedback ?? null, dashboardUrl: `${new URL(getRequest().url).origin}/feedback`,
            }),
          });
        }
      } catch (e) {
        console.error("Negative feedback alert failed", e);
      }
    }
    return { public: pub, platforms: pub ? activePlatforms(r.businesses) : [] };
  });

function toE164(p: string) {
  let n = p.replace(/[^0-9+]/g, "");
  if (n.startsWith("00")) n = "+" + n.slice(2);
  else if (n.startsWith("0")) n = "+31" + n.slice(1);
  else if (!n.startsWith("+")) n = "+" + n;
  return n;
}
