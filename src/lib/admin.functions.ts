import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function adminClient(ctx: { supabase: any; userId: string }) {
  const { data: ok } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "super_admin" });
  if (!ok) throw new Error("Forbidden");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const adminOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await adminClient(context);
    const [b, p, r, m, q] = await Promise.all([
      db.from("businesses").select("id, name, plan, sms_credits, owner_id, created_at, google_enabled, trustpilot_enabled, facebook_enabled, google_url, trustpilot_url, facebook_url").order("created_at", { ascending: false }),
      db.from("profiles").select("id, full_name, email, created_at").order("created_at", { ascending: false }),
      db.from("user_roles").select("user_id, role"),
      db.from("business_members").select("id, business_id, user_id, role"),
      db.from("review_requests").select("id, business_id, customer_name, status, rating, platform, error, created_at").order("created_at", { ascending: false }).limit(5000),
    ]);
    for (const x of [b, p, r, m, q]) if (x.error) throw new Error(x.error.message);
    return { businesses: b.data!, profiles: p.data!, roles: r.data!, members: m.data!, requests: q.data! };
  });

export const adminSetSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; enabled: boolean }) => d)
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    if (data.userId === context.userId && !data.enabled) throw new Error("Je kunt je eigen adminrechten niet intrekken");
    const res = data.enabled
      ? await db.from("user_roles").upsert({ user_id: data.userId, role: "super_admin" }, { onConflict: "user_id,role" })
      : await db.from("user_roles").delete().eq("user_id", data.userId).eq("role", "super_admin");
    if (res.error) throw new Error(res.error.message);
    return { ok: true };
  });

export const adminSetMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { memberId: string; role: "owner" | "staff" }) => {
    if (d.role !== "owner" && d.role !== "staff") throw new Error("Invalid role");
    return d;
  })
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const { error } = await db.from("business_members").update({ role: data.role }).eq("id", data.memberId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

type BizUpdate = {
  businessId: string; plan: string; smsCredits: number; name: string;
  google_url: string; trustpilot_url: string; facebook_url: string;
  google_enabled: boolean; trustpilot_enabled: boolean; facebook_enabled: boolean;
};
const cleanUrl = (u: string) => {
  const v = (u ?? "").trim();
  if (!v) return null;
  if (!/^https?:\/\/\S+$/i.test(v) || v.length > 1000) throw new Error("Ongeldige link: " + v);
  return v;
};

export const adminUpdateBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: BizUpdate) => {
    if (!["demo", "starter", "business"].includes(d.plan)) throw new Error("Invalid plan");
    if (!Number.isInteger(d.smsCredits) || d.smsCredits < 0 || d.smsCredits > 1_000_000) throw new Error("Invalid credits");
    const name = (d.name ?? "").trim();
    if (!name || name.length > 120) throw new Error("Ongeldige bedrijfsnaam");
    return { ...d, name };
  })
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const { error } = await db.from("businesses").update({
      plan: data.plan, sms_credits: data.smsCredits, name: data.name,
      google_url: cleanUrl(data.google_url), trustpilot_url: cleanUrl(data.trustpilot_url), facebook_url: cleanUrl(data.facebook_url),
      google_enabled: !!data.google_enabled, trustpilot_enabled: !!data.trustpilot_enabled, facebook_enabled: !!data.facebook_enabled,
    }).eq("id", data.businessId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Discount codes (Stripe coupons + promotion codes), super_admin only ----
export const adminListPromoCodes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adminClient(context);
    const { stripe } = await import("@/lib/stripe.server");
    const res = await stripe("promotion_codes", { limit: 100, expand: { 0: "data.promotion.coupon" } }, "GET");
    return (res.data as any[]).map((p) => ({
      id: p.id as string, code: p.code as string, active: !!p.active,
      percentOff: ((p.promotion?.coupon ?? p.coupon)?.percent_off ?? null) as number | null,
      amountOff: ((p.promotion?.coupon ?? p.coupon)?.amount_off ?? null) as number | null,
      duration: ((p.promotion?.coupon ?? p.coupon)?.duration ?? "once") as string,
      months: ((p.promotion?.coupon ?? p.coupon)?.duration_in_months ?? null) as number | null,
      timesRedeemed: (p.times_redeemed ?? 0) as number,
      maxRedemptions: (p.max_redemptions ?? null) as number | null,
      expiresAt: (p.expires_at ?? null) as number | null,
    }));
  });

export const adminCreatePromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code: string; type: "percent" | "amount"; value: number; duration: "once" | "repeating" | "forever"; months?: number | undefined; maxRedemptions?: number | undefined; expiresAt?: string | undefined }) => {
    const code = d.code.trim().toUpperCase();
    if (!/^[A-Z0-9-]{3,30}$/.test(code)) throw new Error("Ongeldige code (3–30 tekens, letters, cijfers of -)");
    if (!(d.value > 0) || (d.type === "percent" && d.value > 100)) throw new Error("Ongeldige korting");
    if (d.duration === "repeating" && !(d.months && d.months >= 1 && d.months <= 36)) throw new Error("Ongeldig aantal maanden");
    return { ...d, code };
  })
  .handler(async ({ data, context }) => {
    await adminClient(context);
    const { stripe } = await import("@/lib/stripe.server");
    const coupon = await stripe("coupons", {
      name: data.code, duration: data.duration,
      duration_in_months: data.duration === "repeating" ? data.months : undefined,
      ...(data.type === "percent" ? { percent_off: data.value } : { amount_off: Math.round(data.value * 100), currency: "eur" }),
    });
    await stripe("promotion_codes", {
      promotion: { type: "coupon", coupon: coupon.id }, code: data.code,
      max_redemptions: data.maxRedemptions || undefined,
      expires_at: data.expiresAt ? Math.floor(new Date(data.expiresAt + "T23:59:59").getTime() / 1000) : undefined,
    });
    return { ok: true };
  });

export const adminTogglePromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; active: boolean }) => d)
  .handler(async ({ data, context }) => {
    await adminClient(context);
    const { stripe } = await import("@/lib/stripe.server");
    await stripe(`promotion_codes/${data.id}`, { active: data.active });
    return { ok: true };
  });
