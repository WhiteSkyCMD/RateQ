import { useState } from "react";
import { toast } from "sonner";
import { Coins } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useServerFn } from "@tanstack/react-start";
import { createCheckout } from "@/lib/billing.functions";
import { CREDIT_PACKS, creditPriceCents, creditPackCents, formatEuro } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BuyCredits({ businessId, plan }: { businessId: string; plan?: string | null }) {
  const { t, lang } = useI18n();
  const checkout = useServerFn(createCheckout);
  const [busy, setBusy] = useState(false);
  async function pay() {
    setBusy(true);
    try {
      const r = await checkout({ data: { businessId, origin: window.location.origin, kind: "credits", qty } });
      window.location.href = r.url;
    } catch { toast.error(t("checkout_err")); setBusy(false); }
  }
  const [qty, setQty] = useState<number>(100);
  const valid = qty >= 10 && qty <= 10000;
  return (
    <section id="credits" className="scroll-mt-24 rounded-xl border border-primary/40 bg-card p-6">
      <div className="flex items-center gap-2">
        <Coins className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">{t("buy_title")}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("buy_sub")} {formatEuro(creditPriceCents(plan) / 100, lang)} {t("buy_each")}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CREDIT_PACKS.map((p) => (
          <button key={p} type="button" onClick={() => setQty(p)}
            className={`rounded-lg border p-4 text-left transition-colors ${qty === p ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
            <p className="text-lg font-bold">{p}</p>
            <p className="text-xs text-muted-foreground">{t("credit_meter")}</p>
            <p className="mt-1 text-sm font-semibold">{formatEuro(creditPackCents(p, plan) / 100, lang)}</p>
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="text-muted-foreground">{t("buy_custom")}</span>
          <Input type="number" min={10} max={10000} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="mt-1 w-40" />
        </label>
        <div className="ml-auto text-right">
          <p className="text-xs text-muted-foreground">{t("buy_total")}</p>
          <p className="text-2xl font-bold">{formatEuro(creditPackCents(valid ? qty : 0, plan) / 100, lang)}</p>
        </div>
        <Button disabled={!valid || busy} onClick={pay}>{t("buy_cta")}</Button>
      </div>
      {!valid && <p className="mt-2 text-xs text-destructive">{t("buy_range")}</p>}
    </section>
  );
}
