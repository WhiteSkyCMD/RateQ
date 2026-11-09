import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { activePlatforms, type RoutingSettings } from "@/lib/routing";
import { Progress } from "@/components/ui/progress";

export function OnboardingChecklist({ business, requestCount }: { business: RoutingSettings & { id: string }; requestCount: number }) {
  const { t } = useI18n();
  const key = `rateq-onboarding-hidden-${business.id}`;
  const [hidden, setHidden] = useState(true);
  useEffect(() => setHidden(localStorage.getItem(key) === "1"), [key]);
  const { data: customers = 0 } = useQuery({
    queryKey: ["customer-count", business.id],
    queryFn: async () => (await supabase.from("customers").select("id", { count: "exact", head: true }).eq("business_id", business.id)).count ?? 0,
  });
  const steps = [
    { done: activePlatforms(business).length > 0, title: t("ob1_t"), desc: t("ob1_d"), to: "/instellingen" as const },
    { done: requestCount > 0, title: t("ob2_t"), desc: t("ob2_d"), to: "/dashboard" as const },
    { done: customers > 0, title: t("ob3_t"), desc: t("ob3_d"), to: "/klanten" as const },
  ];
  const done = steps.filter((s) => s.done).length;
  if (hidden) return null;
  const hide = () => { localStorage.setItem(key, "1"); setHidden(true); };
  return (
    <div className="rounded-2xl border border-primary/30 bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">{done === 3 ? t("ob_done") : t("ob_title")}</h2>
          <p className="text-sm text-muted-foreground">{done}/3 · {t("ob_sub")}</p>
        </div>
        <button onClick={hide} aria-label={t("ob_hide")} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <Progress value={(done / 3) * 100} className="mt-4" />
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {steps.map((s) => (
          <Link key={s.title} to={s.to} className="flex gap-3 rounded-xl border border-border p-4 hover:border-primary/50">
            {s.done ? <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" /> : <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />}
            <div>
              <p className={s.done ? "font-semibold text-muted-foreground line-through" : "font-semibold"}>{s.title}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
