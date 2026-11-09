import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/rateq/site-header";
import { Bullets, CtaBand, Eyebrow, StarSimulator } from "@/components/marketing/sections";
import { FEATURES } from "@/components/marketing/features";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/functies")({
  head: () => ({
    meta: [
      { title: "Functies – RateQ" },
      { name: "description", content: "Slim sterrenfilter, sms- en e-mailuitnodigingen, klantenimport, feedback-schild, teamrollen en inzichten." },
      { property: "og:title", content: "Functies – RateQ" },
      { property: "og:description", content: "Slim sterrenfilter, sms- en e-mailuitnodigingen, klantenimport, feedback-schild, teamrollen en inzichten." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Features,
});

function Features() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="bg-hero">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <Eyebrow>{t("fd_eyebrow")}</Eyebrow>
          <h1 className="mt-3 text-4xl font-extrabold md:text-6xl">{t("fd_title")}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">{t("fd_sub")}</p>
        </div>
      </section>
      {FEATURES.map((f, i) => (
        <section key={f.id} id={f.id} className={cn("scroll-mt-20 border-b border-border", i % 2 && "bg-card/40")}>
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-2">
            <div className={cn(i % 2 && "md:order-2")}>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><f.icon className="h-7 w-7" /></span>
              <h2 className="mt-6 text-3xl font-extrabold">{t(f.t)}</h2>
              <p className="mt-2 font-semibold text-primary">{t(f.d)}</p>
              <p className="mt-4 leading-relaxed text-muted-foreground">{t(f.long)}</p>
              <Bullets items={f.bullets} />
            </div>
            <div className="mx-auto w-full max-w-sm">
              {i === 0 ? <StarSimulator /> : (
                <div className="flex aspect-square items-center justify-center rounded-3xl border border-border bg-card shadow-glow">
                  <f.icon className="h-32 w-32 text-primary/70" strokeWidth={1.2} />
                </div>
              )}
            </div>
          </div>
        </section>
      ))}
      <div className="pt-20"><CtaBand /></div>
      <SiteFooter />
    </div>
  );
}
