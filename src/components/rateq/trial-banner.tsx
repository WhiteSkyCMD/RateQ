import { Link } from "@tanstack/react-router";
import { Clock, Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { isTrialExpired, trialDaysLeft, trialEndsAt } from "@/lib/plans";
import { Button } from "@/components/ui/button";

type Biz = { plan: string; created_at: string };

/** Full-width notice for demo accounts: end date while active, upgrade prompt once expired. */
export function TrialBanner({ business, canUpgrade }: { business: Biz; canUpgrade: boolean }) {
  const { t, lang } = useI18n();
  if (business.plan !== "demo") return null;
  const end = trialEndsAt(business.created_at).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  if (isTrialExpired(business.plan, business.created_at)) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-destructive/40 bg-destructive/10 p-5">
        <div className="flex gap-3">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-semibold">{t("trial_expired")}</p>
            <p className="text-sm text-muted-foreground">{t("trial_expired_d")}</p>
          </div>
        </div>
        {canUpgrade && <Button asChild><Link to="/abonnement">{t("trial_choose")}</Link></Button>}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center gap-3 text-sm">
        <Clock className="h-5 w-5 text-primary" />
        <span><span className="font-semibold">{t("trial_left").replace("{n}", String(trialDaysLeft(business.created_at)))}</span> · {t("trial_ends").replace("{d}", end)}</span>
      </div>
      {canUpgrade && <Button asChild size="sm" variant="outline"><Link to="/abonnement">{t("trial_choose")}</Link></Button>}
    </div>
  );
}
