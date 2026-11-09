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
      db.from("businesses").select("id, name, plan, sms_credits, owner_id, created_at, google_enabled, trustpilot_enabled, facebook_enabled").order("created_at", { ascending: false }),
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

export const adminUpdateBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { businessId: string; plan: string; smsCredits: number }) => {
    if (!["demo", "starter", "business"].includes(d.plan)) throw new Error("Invalid plan");
    if (!Number.isInteger(d.smsCredits) || d.smsCredits < 0 || d.smsCredits > 1_000_000) throw new Error("Invalid credits");
    return d;
  })
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const { error } = await db.from("businesses").update({ plan: data.plan, sms_credits: data.smsCredits }).eq("id", data.businessId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
