import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader, SiteFooter } from "@/components/rateq/site-header";
import { Eyebrow } from "@/components/marketing/sections";
import { submitContact, contactSchema } from "@/lib/contact.functions";
import { useI18n, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact – RateQ" },
      { name: "description", content: "Vragen over RateQ, een demo of een offerte voor meerdere locaties? Neem contact met ons op." },
      { property: "og:title", content: "Contact – RateQ" },
      { property: "og:description", content: "Vragen over RateQ, een demo of een offerte voor meerdere locaties? Neem contact met ons op." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Contact,
});

const EMPTY = { name: "", company: "", email: "", phone: "", message: "", website: "" };

function Contact() {
  const { t } = useI18n();
  const send = useServerFn(submitContact);
  const [f, setF] = useState(EMPTY);
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactSchema.safeParse(f).success) return setState("err");
    setState("busy");
    try { await send({ data: f }); setState("ok"); setF(EMPTY); } catch { setState("err"); }
  };

  const why: TKey[] = ["ct_why1", "ct_why2", "ct_why3"];
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="bg-hero">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-[1fr_1.2fr]">
          <div>
            <Eyebrow>{t("ct_eyebrow")}</Eyebrow>
            <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">{t("ct_title")}</h1>
            <p className="mt-5 text-lg text-muted-foreground">{t("ct_sub")}</p>
            <div className="mt-10 rounded-2xl border border-border bg-card p-6">
              <p className="font-bold">{t("ct_why_t")}</p>
              <ul className="mt-4 space-y-3">
                {why.map((w) => <li key={w} className="flex gap-2 text-sm"><Check className="h-4 w-4 shrink-0 text-primary" />{t(w)}</li>)}
              </ul>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-8 shadow-glow">
            {state === "ok" ? (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-14 w-14 text-primary" />
                <h2 className="mt-4 text-2xl font-bold">{t("ct_ok_t")}</h2>
                <p className="mt-2 text-muted-foreground">{t("ct_ok_d")}</p>
                <Button variant="outline" className="mt-6" onClick={() => setState("idle")}>{t("ct_again")}</Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label htmlFor="name">{t("ct_name")}</Label><Input id="name" required maxLength={100} value={f.name} onChange={set("name")} className="mt-1.5" /></div>
                  <div><Label htmlFor="company">{t("ct_company")}</Label><Input id="company" maxLength={120} value={f.company} onChange={set("company")} className="mt-1.5" /></div>
                  <div><Label htmlFor="email">{t("ct_email")}</Label><Input id="email" type="email" required maxLength={255} value={f.email} onChange={set("email")} className="mt-1.5" /></div>
                  <div><Label htmlFor="phone">{t("ct_phone")}</Label><Input id="phone" type="tel" maxLength={30} value={f.phone} onChange={set("phone")} className="mt-1.5" /></div>
                </div>
                <div><Label htmlFor="message">{t("ct_message")}</Label><Textarea id="message" required minLength={5} maxLength={2000} rows={6} placeholder={t("ct_message_ph")} value={f.message} onChange={set("message")} className="mt-1.5" /></div>
                <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={f.website} onChange={set("website")} />
                {state === "err" && <p className="text-sm text-destructive">{t("ct_err")}</p>}
                <Button type="submit" size="lg" className="w-full shadow-glow" disabled={state === "busy"}>{state === "busy" ? t("ct_sending") : t("ct_send")}</Button>
              </form>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
