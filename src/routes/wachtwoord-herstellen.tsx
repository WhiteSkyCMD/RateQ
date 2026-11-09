import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo, LangToggle } from "@/components/rateq/brand";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/wachtwoord-herstellen")({
  head: () => ({
    meta: [
      { title: "Nieuw wachtwoord instellen – RateQ" },
      { name: "description", content: "Stel een nieuw wachtwoord in voor je RateQ-account." },
      { property: "og:title", content: "Nieuw wachtwoord instellen – RateQ" },
      { property: "og:description", content: "Stel een nieuw wachtwoord in voor je RateQ-account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => { if (s.session) setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("rp_ok"));
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="bg-hero flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 flex w-full max-w-md items-center justify-between"><Logo /><LangToggle /></div>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
        <h1 className="text-2xl font-bold">{t("rp_title")}</h1>
        {!ready ? (
          <p className="mt-4 text-sm text-muted-foreground">{t("rp_invalid")}</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div><Label>{t("rp_new")}</Label><Input type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} /></div>
            <Button type="submit" className="w-full" disabled={busy}>{t("rp_save")}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
