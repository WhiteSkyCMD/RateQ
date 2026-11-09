import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PLANS, creditPackCents } from "@/lib/plans";

async function assertOwner(context: any, businessId: string) {
  const { data: role } = await context.supabase.rpc("member_role", { _business_id: businessId, _user_id: context.userId });
  if (role !== "owner") throw new Error("Forbidden");
}

// Owner-only: start a Stripe Checkout for a plan or a credit top-up.
export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { businessId: string; origin: string; kind: "plan" | "credits"; planId?: string; yearly?: boolean; qty?: number }) => d)
  .handler(async ({ data, context }) => {
    await assertOwner(context, data.businessId);
    if (!/^https?:\/\/[^/]+$/.test(data.origin)) throw new Error("bad origin");
    const { stripe } = await import("@/lib/stripe.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: b } = await supabaseAdmin.from("businesses").select("id, name, plan, stripe_customer_id").eq("id", data.businessId).single();
    if (!b) throw new Error("not found");

    let customer = b.stripe_customer_id;
    if (!customer) {
      const c = await stripe("customers", { name: b.name, email: context.claims?.email, metadata: { business_id: b.id } });
      customer = c.id as string;
      await supabaseAdmin.from("businesses").update({ stripe_customer_id: customer }).eq("id", b.id);
    }
    const base = {
      customer, client_reference_id: b.id,
      success_url: `${data.origin}/abonnement?checkout=success`,
      cancel_url: `${data.origin}/abonnement?checkout=cancel`,
      automatic_tax: { enabled: true }, customer_update: { address: "auto", name: "auto" },
    };

    if (data.kind === "credits") {
      const qty = Math.floor(data.qty ?? 0);
      if (qty < 10 || qty > 10000) throw new Error("bad qty");
      const s = await stripe("checkout/sessions", {
        ...base, mode: "payment",
        line_items: { 0: { quantity: 1, price_data: { currency: "eur", unit_amount: creditPackCents(qty, b.plan), tax_behavior: "inclusive", product_data: { name: `${qty} berichten (RateQ)`, tax_code: "txcd_10000000" } } } },
        metadata: { business_id: b.id, kind: "credits", qty: String(qty) },
        invoice_creation: { enabled: true },
      });
      return { url: s.url as string };
    }

    const plan = PLANS.find((p) => p.id === data.planId && p.price > 0);
    if (!plan) throw new Error("bad plan");
    const yearly = !!data.yearly;
    const amount = Math.round((yearly ? plan.yearly * 12 : plan.price) * 100);
    const meta = { business_id: b.id, kind: "plan", plan: plan.id };
    const s = await stripe("checkout/sessions", {
      ...base, mode: "subscription",
      line_items: { 0: { quantity: 1, price_data: { currency: "eur", unit_amount: amount, tax_behavior: "inclusive", recurring: { interval: yearly ? "year" : "month" }, product_data: { name: `RateQ ${plan.id === "starter" ? "Starter" : "Business"}`, tax_code: "txcd_10000000" } } } },
      metadata: meta, subscription_data: { metadata: meta },
    });
    return { url: s.url as string };
  });

// Owner-only: cancel or resume the subscription (takes effect at period end).
export const setCancellation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { businessId: string; cancel: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertOwner(context, data.businessId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: b } = await supabaseAdmin.from("businesses").select("stripe_subscription_id").eq("id", data.businessId).single();
    if (b?.stripe_subscription_id) {
      const { stripe } = await import("@/lib/stripe.server");
      await stripe(`subscriptions/${b.stripe_subscription_id}`, { cancel_at_period_end: data.cancel });
    }
    const { error } = await supabaseAdmin.from("businesses").update({
      cancel_at_period_end: data.cancel,
      cancelled_at: data.cancel ? new Date().toISOString() : null,
    }).eq("id", data.businessId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
