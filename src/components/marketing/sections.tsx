import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useI18n, type TKey } from "@/lib/i18n";
import { isPublicRating } from "@/lib/routing";
import { cn } from "@/lib/utils";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{children}</span>;
}

export function StarSimulator() {
  const { t } = useI18n();
  const [r, setR] = useState(5);
  const high = isPublicRating(r);
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-glow">
      <p className="text-center text-xs text-muted-foreground">{t("sim_label")}</p>
      <p className="mt-3 text-center text-sm text-muted-foreground">{t("rv_title")}</p>
      <p className="text-center text-lg font-bold">Bakkerij De Molen</p>
      <div className="mt-4 flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setR(n)} aria-label={`${n}`} className={cn("text-4xl transition-transform hover:scale-110", n <= r ? "text-star" : "text-muted")}>★</button>
        ))}
      </div>
      <div className={cn("mt-6 rounded-xl px-4 py-3 text-center text-sm font-semibold transition-colors", high ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive")}>
        {high ? `→ ${t("sim_high")}` : `→ ${t("sim_low")}`}
      </div>
    </div>
  );
}

export function Stats() {
  const { t } = useI18n();
  const s: [TKey, TKey][] = [["stat1_v", "stat1_l"], ["stat2_v", "stat2_l"], ["stat3_v", "stat3_l"], ["stat4_v", "stat4_l"]];
  return (
    <section className="border-y border-border bg-card/40">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-12 md:grid-cols-4">
        {s.map(([v, l]) => (
          <div key={v} className="text-center">
            <p className="text-3xl font-extrabold text-primary md:text-4xl">{t(v)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t(l)}</p>
          </div>
        ))}
      </div>
      <p className="pb-4 text-center text-xs text-muted-foreground">{t("stat_note")}</p>
    </section>
  );
}

export function Bullets({ items }: { items: TKey[] }) {
  const { t } = useI18n();
  return (
    <ul className="mt-5 space-y-2">
      {items.map((b) => (
        <li key={b} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{t(b)}</li>
      ))}
    </ul>
  );
}

export function Roi() {
  const { t } = useI18n();
  const [n, setN] = useState([40]);
  const extra = Math.round((n[0] ?? 0) * 4.3 * 0.25 * 0.8);
  return (
    <section className="mx-auto max-w-4xl px-4 py-20">
      <div className="rounded-3xl border border-border bg-card p-8 md:p-12">
        <h2 className="text-center text-3xl font-bold">{t("roi_t")}</h2>
        <p className="mt-2 text-center text-muted-foreground">{t("roi_sub")}</p>
        <div className="mt-10 grid items-center gap-8 md:grid-cols-2">
          <div>
            <div className="mb-4 flex justify-between text-sm"><span>{t("roi_cust")}</span><span className="font-bold">{n[0]}</span></div>
            <Slider min={5} max={300} step={5} value={n} onValueChange={setN} />
          </div>
          <div className="rounded-2xl bg-primary/10 p-6 text-center">
            <p className="text-5xl font-extrabold text-primary">+{extra}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("roi_res")}</p>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">{t("roi_note")}</p>
      </div>
    </section>
  );
}

export function Testimonials() {
  const { t } = useI18n();
  const q: [TKey, TKey][] = [["testi1", "testi1_n"], ["testi2", "testi2_n"], ["testi3", "testi3_n"]];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <h2 className="text-center text-3xl font-bold">{t("testi_t")}</h2>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {q.map(([a, b]) => (
          <figure key={a} className="rounded-2xl border border-border bg-card p-6">
            <Quote className="h-6 w-6 text-primary" />
            <div className="mt-3 text-star">★★★★★</div>
            <blockquote className="mt-3 text-sm">{t(a)}</blockquote>
            <figcaption className="mt-4 text-xs font-semibold text-muted-foreground">{t(b)}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function Faq() {
  const { t } = useI18n();
  const items = [1, 2, 3, 4, 5, 6] as const;
  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      <h2 className="text-center text-3xl font-bold">{t("faq_t")}</h2>
      <Accordion type="single" collapsible className="mt-8">
        {items.map((i) => (
          <AccordionItem key={i} value={`q${i}`}>
            <AccordionTrigger className="text-left">{t(`faq${i}_q` as TKey)}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{t(`faq${i}_a` as TKey)}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

export function CtaBand() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24">
      <div className="bg-hero rounded-3xl border border-primary/30 p-10 text-center md:p-16">
        <h2 className="text-3xl font-extrabold md:text-4xl">{t("cta_t")}</h2>
        <p className="mt-3 text-muted-foreground">{t("cta_sub")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="shadow-glow"><Link to="/auth" search={{ mode: "signup" }}>{t("hero_cta")} <ArrowRight /></Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/contact">{t("nav_contact")}</Link></Button>
        </div>
      </div>
    </section>
  );
}
