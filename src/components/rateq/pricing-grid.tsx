import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS, formatEuro } from "@/lib/plans";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function PricingGrid({ current, onChoose }: { current?: string; onChoose?: ((planId: string, yearly: boolean) => void) | undefined }) {
  const { t, lang } = useI18n();
  const [yearly, setYearly] = useState(false);
  return (
    <div>
      <div className="mb-10 flex justify-center">
        <div className="inline-flex items-center rounded-full border border-border bg-card p-1 text-sm font-semibold">
          {[false, true].map((y) => (
            <button key={String(y)} onClick={() => setYearly(y)} className={cn("rounded-full px-4 py-1.5 transition-colors", yearly === y ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {y ? t("bill_yearly") : t("bill_monthly")}
              {y && <span className={cn("ml-2 text-xs", yearly ? "text-primary-foreground/80" : "text-primary")}>{t("bill_save")}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((p) => {
          const price = yearly ? p.yearly : p.price;
          return (
            <div key={p.id} className={cn("relative flex flex-col rounded-2xl border bg-card p-6", p.popular ? "border-primary shadow-glow md:-translate-y-2" : "border-border")}>
              {(p.popular || p.badge) && (
                <span className={cn("absolute -top-3 left-6 rounded-full px-3 py-0.5 text-xs font-bold", p.popular ? "bg-primary text-primary-foreground" : "border border-star/40 bg-card text-star")}>
                  {p.popular ? t("popular") : t(p.badge!)}
                </span>
              )}
              <h3 className="text-lg font-bold">{t(p.name)}</h3>
              <p className="text-sm text-muted-foreground">{t(p.desc)}</p>
              <p className="mt-6 text-4xl font-extrabold">{formatEuro(price, lang)}<span className="text-base font-medium text-muted-foreground">{t("per_month")}</span></p>
              <p className="mt-1 h-4 text-xs text-muted-foreground">{p.price === 0 ? t("no_card") : yearly ? t("per_month_yearly") : ""}</p>
              <ul className="mt-6 flex-1 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{t(f)}</li>
                ))}
              </ul>
              {current ? (
                <Button className="mt-6" variant={current === p.id ? "secondary" : "default"} disabled={current === p.id || p.price === 0 || !onChoose} onClick={() => onChoose?.(p.id, yearly)}>
                  {current === p.id ? t("bill_current") : t("choose")}
                </Button>
              ) : (
                <Button asChild className="mt-6" variant={p.popular ? "default" : "outline"}>
                  <Link to="/auth" search={{ mode: "signup" }}>{t("choose")}</Link>
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
