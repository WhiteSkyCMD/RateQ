import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";
import { OwnerOnly } from "@/components/rateq/owner-only";
import { TrialBanner } from "@/components/rateq/trial-banner";
import { BuyCredits } from "@/components/rateq/buy-credits";
import { PricingGrid } from "@/components/rateq/pricing-grid";
import { setCancellation, createCheckout } from "@/lib/billing.functions";
import { formatEuro, PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/abonnement")({
  head: () => ({ meta: [{ title: "Abonnement – RateQ" }] }),
  component: () => <OwnerOnly><Billing /></OwnerOnly>,
});

function Billing() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const { data: ws } = useWorkspace();
  const b = ws!.business!;
  const cancelFn = useServerFn(setCancellation);
  const [busy, setBusy] = useState(false);
  const checkoutFn = useServerFn(createCheckout);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("checkout") === "success") {
      toast.success(t("checkout_ok"));
      const refresh = () => { qc.invalidateQueries({ queryKey: ["workspace"] }); qc.invalidateQueries({ queryKey: ["invoices"] }); };
      setTimeout(refresh, 2000); setTimeout(refresh, 6000);
      window.history.replaceState(null, "", "/abonnement");
    }
  }, []);

  async function choosePlan(planId: string, yearly: boolean) {
    try {
      const r = await checkoutFn({ data: { businessId: b.id, origin: window.location.origin, kind: "plan", planId, yearly } });
      window.location.href = r.url;
    } catch { toast.error(t("checkout_err")); }
  }
  const plan = PLANS.find((p) => p.id === b.plan);
  const paid = !!plan && plan.price > 0;

  const invoices = useQuery({
    queryKey: ["invoices", b.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("*").eq("business_id", b.id).order("issued_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function toggle(cancel: boolean) {
    setBusy(true);
    try {
      await cancelFn({ data: { businessId: b.id, cancel } });
      await qc.invalidateQueries({ queryKey: ["workspace"] });
      toast.success(cancel ? t("bill_cancelled_ok") : t("bill_resumed_ok"));
    } catch {
      toast.error(t("ct_err"));
    } finally { setBusy(false); }
  }

  const date = (s: string) => new Date(s).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t("bill_title")}</h1>
        <p className="text-sm text-muted-foreground">{t("credits")}: <span className="font-semibold text-foreground">{b.sms_credits}</span> · {t("bill_soon")}</p>
      </div>

      <TrialBanner business={b} canUpgrade={false} />

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t("bill_current")}</p>
            <p className="text-xl font-semibold">{plan ? t(plan.name) : b.plan}</p>
            {b.cancel_at_period_end && <p className="mt-1 text-sm text-destructive">{t("bill_cancel_pending")}</p>}
          </div>
          {paid && (b.cancel_at_period_end ? (
            <Button variant="outline" disabled={busy} onClick={() => toggle(false)}>{t("bill_resume")}</Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive" disabled={busy}>{t("bill_cancel")}</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("bill_cancel_q")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("bill_cancel_d")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("bill_keep")}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => toggle(true)}>{t("bill_cancel_confirm")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ))}
        </div>
      </section>

      <BuyCredits businessId={b.id} plan={b.plan} />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{t("inv_title")}</h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b border-border">
                <th className="p-3">{t("inv_number")}</th><th className="p-3">{t("inv_date")}</th>
                <th className="p-3">{t("inv_desc")}</th><th className="p-3 text-right">{t("inv_amount")}</th><th className="p-3">{t("inv_status")}</th>
              </tr>
            </thead>
            <tbody>
              {(invoices.data ?? []).map((i) => (
                <tr key={i.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-mono">{i.number}</td><td className="p-3">{date(i.issued_at)}</td>
                  <td className="p-3">{i.description}</td><td className="p-3 text-right">{formatEuro(i.amount_cents / 100, lang)}</td>
                  <td className="p-3">{i.status === "paid" ? t("inv_paid") : t("inv_open")}</td>
                </tr>
              ))}
              {!invoices.isLoading && !invoices.data?.length && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">{t("inv_empty")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <PricingGrid current={b.plan} onChoose={b.stripe_subscription_id ? undefined : choosePlan} />
    </div>
  );
}
