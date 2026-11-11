import { createFileRoute } from "@tanstack/react-router";
import { UserPlus, MessageSquareText, Star, Route as RouteIcon } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/rateq/site-header";
import { CtaBand, Eyebrow, Faq, StarSimulator, CustomerView } from "@/components/marketing/sections";
import { useI18n, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/hoe-het-werkt")({
  head: () => ({
    meta: [
      { title: "Hoe het werkt – RateQ" },
      { name: "description", content: "In vier stappen van klantbezoek naar een 5-sterren review op Google, zonder publieke klachten." },
      { property: "og:title", content: "Hoe het werkt – RateQ" },
      { property: "og:description", content: "In vier stappen van klantbezoek naar een 5-sterren review op Google, zonder publieke klachten." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.rateq.nl/hoe-het-werkt" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.rateq.nl/hoe-het-werkt" }],
  }),
  component: How,
});

const STEPS: { i: typeof Star; k: TKey; d: TKey }[] = [
  { i: UserPlus, k: "how1", d: "fd3_long" },
  { i: MessageSquareText, k: "how2", d: "fd2_long" },
  { i: Star, k: "how3", d: "fd1_long" },
  { i: RouteIcon, k: "how4", d: "fd4_long" },
];

function How() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="bg-hero">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <Eyebrow>{t("nav_how")}</Eyebrow>
          <h1 className="mt-3 text-4xl font-extrabold md:text-6xl">{t("how_t")}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">{t("hero_sub")}</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-[1.3fr_1fr]">
        <ol className="relative space-y-8 border-l border-border pl-8">
          {STEPS.map((s, i) => (
            <li key={s.k} className="relative">
              <span className="absolute -left-[3.15rem] flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">{i + 1}</span>
              <div className="rounded-2xl border border-border bg-card p-6">
                <s.i className="h-6 w-6 text-primary" />
                <h2 className="mt-3 text-xl font-bold">{t(s.k)}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(s.d)}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="md:sticky md:top-24 md:self-start"><StarSimulator /></div>
      </section>
      <CustomerView />
      <Faq />
      <CtaBand />
      <SiteFooter />
    </div>
  );
}
