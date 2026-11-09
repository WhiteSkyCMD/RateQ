import { createFileRoute } from "@tanstack/react-router";
import { Check, Minus } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/rateq/site-header";
import { PricingGrid } from "@/components/rateq/pricing-grid";
import { CtaBand, Eyebrow, Faq } from "@/components/marketing/sections";
import { useI18n, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/prijzen")({
  head: () => ({
    meta: [
      { title: "Prijzen – RateQ" },
      { name: "description", content: "Gratis demo, Starter voor 1 locatie of Business met inbegrepen sms-credits. Maandelijks opzegbaar." },
      { property: "og:title", content: "Prijzen – RateQ" },
      { property: "og:description", content: "Gratis demo, Starter voor 1 locatie of Business met inbegrepen sms-credits. Maandelijks opzegbaar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pricing,
});

type Cell = TKey | "1" | boolean;
const ROWS: [TKey, Cell, Cell, Cell][] = [
  ["cmp_sms", "cmp_demo_sms", "cmp_st_sms", "cmp_bu_sms"],
  ["cmp_email_inv", "cmp_unl", "cmp_unl", "cmp_unl"],
  ["cmp_loc", "1", "1", "cmp_upto3"],
  ["cmp_users", "1", "1", "cmp_multi"],
  ["cmp_routing", true, true, true],
  ["side_feedback", true, true, true],
  ["cmp_reminders", false, false, true],
  ["cmp_extra", false, "pf_st7", "pf_bu7"],
  ["cmp_support", "cmp_email", "cmp_email", "cmp_prio"],
];

function Pricing() {
  const { t } = useI18n();
  const show = (c: Cell) => c === true ? <Check className="mx-auto h-5 w-5 text-primary" /> : c === false ? <Minus className="mx-auto h-5 w-5 text-muted-foreground" /> : c === "1" ? "1" : t(c);
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="bg-hero">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="text-center">
            <Eyebrow>{t("nav_pricing")}</Eyebrow>
            <h1 className="mt-3 text-4xl font-extrabold md:text-6xl">{t("pricing_t")}</h1>
            <p className="mt-4 text-muted-foreground">{t("pricing_sub")}</p>
          </div>
          <div className="mt-14"><PricingGrid /></div>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold">{t("compare_t")}</h2>
        <div className="mt-10 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left">
              <th className="p-4">{t("cmp_feature")}</th>
              <th className="p-4 text-center">{t("plan_demo")}</th>
              <th className="p-4 text-center text-primary">{t("plan_starter")}</th>
              <th className="p-4 text-center">{t("plan_business")}</th>
            </tr></thead>
            <tbody>
              {ROWS.map(([k, ...cells]) => (
                <tr key={k} className="border-b border-border last:border-0">
                  <td className="p-4 font-medium">{t(k)}</td>
                  {cells.map((c, i) => <td key={i} className="p-4 text-center text-muted-foreground">{show(c)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <Faq />
      <CtaBand />
      <SiteFooter />
    </div>
  );
}
