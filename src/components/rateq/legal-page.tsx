import { SiteHeader, SiteFooter } from "@/components/rateq/site-header";
import { useI18n } from "@/lib/i18n";
import { COMPANY, LEGAL, type LegalKey } from "@/lib/legal";

export function LegalPage({ doc }: { doc: LegalKey }) {
  const { lang, t } = useI18n();
  const d = LEGAL[doc][lang];
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <h1 className="text-4xl font-bold">{d.title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">{t("legal_updated")} 9-11-2026</p>
        <p className="mt-6 text-muted-foreground">{d.intro}</p>
        <div className="mt-10 space-y-8">
          {d.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-xl font-semibold">{s.h}</h2>
              {s.p.map((p, i) => <p key={i} className="mt-3 leading-relaxed text-muted-foreground">{p}</p>)}
            </section>
          ))}
        </div>
        <div className="mt-12 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">{COMPANY.name}</p>
          <p>KvK: {COMPANY.kvk} · {t("legal_vat")}: {COMPANY.vat}</p>
          <p>{COMPANY.email}</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
