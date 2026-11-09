import { createFileRoute } from "@tanstack/react-router";
import { planCredits } from "@/lib/plans";

// Stripe webhook: verified with STRIPE_WEBHOOK_SECRET before anything is touched.
export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["STRIPE_WEBHOOK_SECRET"];
        if (!secret) return new Response("webhook secret missing", { status: 500 });
        const { verifyStripeEvent, stripe } = await import("@/lib/stripe.server");
        const payload = await request.text();
        let event: any;
        try { event = await verifyStripeEvent(payload, request.headers.get("stripe-signature"), secret); }
        catch { return new Response("invalid signature", { status: 400 }); }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const o = event.data.object;

        const addInvoice = async (businessId: string, ref: string, desc: string, cents: number, number?: string) => {
          const { error } = await supabaseAdmin.from("invoices").insert({
            business_id: businessId, stripe_ref: ref, description: desc, amount_cents: cents, status: "paid",
            number: number ?? `RQ-${ref.slice(-8).toUpperCase()}`,
          });
          return !error; // false = duplicate delivery
        };

        if (event.type === "checkout.session.completed") {
          const m = o.metadata ?? {};
          if (m.kind === "credits" && o.payment_status === "paid") {
            const qty = Number(m.qty);
            if (await addInvoice(m.business_id, o.id, `${qty} berichten`, o.amount_total ?? 0)) {
              await supabaseAdmin.rpc("add_sms_credits", { _business_id: m.business_id, _qty: qty });
            }
          }
          if (m.kind === "plan") {
            await supabaseAdmin.from("businesses").update({
              plan: m.plan, stripe_subscription_id: o.subscription, cancel_at_period_end: false, cancelled_at: null,
            }).eq("id", m.business_id);
          }
        }

        if (event.type === "invoice.paid" && o.subscription) {
          const sub = await stripe(`subscriptions/${o.subscription}`, undefined, "GET");
          const bid = sub.metadata?.business_id;
          const plan = sub.metadata?.plan;
          if (bid && (await addInvoice(bid, o.id, `Abonnement ${plan}`, o.amount_paid ?? 0, o.number ?? undefined))) {
            await supabaseAdmin.rpc("add_sms_credits", { _business_id: bid, _qty: planCredits(plan) });
          }
        }

        if (event.type === "customer.subscription.updated") {
          const bid = o.metadata?.business_id;
          if (bid) await supabaseAdmin.from("businesses").update({ cancel_at_period_end: !!o.cancel_at_period_end }).eq("id", bid);
        }

        if (event.type === "customer.subscription.deleted") {
          const bid = o.metadata?.business_id;
          if (bid) await supabaseAdmin.from("businesses").update({ plan: "demo", stripe_subscription_id: null, cancel_at_period_end: false }).eq("id", bid);
        }

        return new Response("ok");
      },
    },
  },
});
