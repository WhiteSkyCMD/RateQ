import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Star, Scissors, Car, UtensilsCrossed, Stethoscope, Wrench, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader, SiteFooter } from "@/components/rateq/site-header";
import { StarSimulator, Stats, Roi, Testimonials, Faq, CtaBand, Eyebrow } from "@/components/marketing/sections";
import { FEATURES } from "@/components/marketing/features";
import { useI18n, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RateQ – Meer 5-sterren reviews, automatisch" },
      { name: "description", content: "Stuur klanten een persoonlijke review-link per sms. Tevreden klanten naar Google, Trustpilot of Facebook, klachten blijven intern." },
      { property: "og:title", content: "RateQ – Meer 5-sterren reviews, automatisch" },
      { property: "og:description", content: "Stuur klanten een persoonlijke review-link per sms. Tevreden klanten naar Google, Trustpilot of Facebook, klachten blijven intern." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const INDUSTRIES: { i: typeof Store; k: TKey }[] = [
  { i: Scissors, k: "ind1" }, { i: Car, k: "ind2" }, { i: UtensilsCrossed, k: "ind3" },
  { i: Stethoscope, k: "ind4" }, { i: Wrench, k: "ind5" }, { i: Store, k: "ind6" },
];

function Index() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="bg-hero relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-[1.2fr_1fr] md:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Star className="h-3.5 w-3.5 fill-current" /> {t("hero_badge")}
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">{t("hero_title")}</h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">{t("hero_sub")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-glow"><Link to="/auth" search={{ mode: "signup" }}>{t("hero_cta")} <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/prijzen">{t("hero_cta2")}</Link></Button>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-sm"><StarSimulator /></div>
        </div>
      </section>
      <Stats />

      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="text-center">
          <Eyebrow>{t("fd_eyebrow")}</Eyebrow>
          <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-extrabold md:text-5xl">{t("fd_title")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{t("fd_sub")}</p>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link key={f.id} to="/functies" hash={f.id} className="group rounded-3xl border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:border-primary/40">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><f.icon className="h-7 w-7" /></span>
              <h3 className="mt-6 text-xl font-bold">{t(f.t)}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(f.long)}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">{t("learn_more")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-3xl font-bold">{t("how_t")}</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-4">
            {[t("how1"), t("how2"), t("how3"), t("how4")].map((s, i) => (
              <li key={i} className="rounded-2xl border border-border bg-card p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">{i + 1}</span>
                <p className="mt-4 text-sm">{s}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 text-center"><Button asChild variant="outline"><Link to="/hoe-het-werkt">{t("learn_more")} <ArrowRight /></Link></Button></div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold">{t("ind_t")}</h2>
        <p className="mt-2 text-center text-muted-foreground">{t("ind_sub")}</p>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-6">
          {INDUSTRIES.map(({ i: I, k }) => (
            <div key={k} className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center">
              <I className="h-7 w-7 text-primary" /><span className="text-sm font-semibold">{t(k)}</span>
            </div>
          ))}
        </div>
      </section>
      <Roi />
      <Testimonials />
      <Faq />
      <CtaBand />
      <SiteFooter />
    </div>
  );
}
