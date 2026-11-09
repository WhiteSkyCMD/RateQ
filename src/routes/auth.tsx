import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo, LangToggle } from "@/components/rateq/brand";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ mode: s["mode"] === "signup" ? ("signup" as const) : undefined }),
  head: () => ({
    meta: [
      { title: "Inloggen – RateQ" },
      { name: "description", content: "Log in of maak een RateQ-account aan." },
      { property: "og:title", content: "Inloggen – RateQ" },
      { property: "og:description", content: "Log in of maak een RateQ-account aan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function GoogleG() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
  );
}

function AuthPage() {
  const { t } = useI18n();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [signup, setSignup] = useState(search.mode === "signup");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ email: "", password: "", name: "", business: "", invite: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (signup) {
        const { data, error } = await supabase.auth.signUp({
          email: f.email, password: f.password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: f.name, business_name: f.business, invite_code: f.invite } },
        });
        if (error) throw error;
        if (!data.session) toast.success(t("auth_check_email"));
        else navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    if (!f.email) { toast.error(t("auth_forgot_need")); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(f.email, { redirectTo: window.location.origin + "/wachtwoord-herstellen" });
    if (error) { toast.error(error.message); return; }
    toast.success(t("auth_forgot_sent"));
  }

  async function google() {
    // Lovable-hosted preview uses the managed Google broker; elsewhere (Vercel) use Supabase OAuth directly.
    if (!/\.lovable\.(app|dev)$/.test(window.location.hostname)) {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/dashboard" } });
      if (error) toast.error(error.message);
      return;
    }
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) { toast.error(r.error.message); return; }
    if (r.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="bg-hero flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 flex w-full max-w-md items-center justify-between"><Logo /><LangToggle /></div>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
        <h1 className="text-2xl font-bold">{signup ? t("auth_signup") : t("auth_login")}</h1>
        <button type="button" onClick={google} className="mt-6 flex h-10 w-full items-center justify-center gap-2.5 rounded-md border border-[#8E918F] bg-[#131314] text-sm font-medium text-[#E3E3E3]">
          <GoogleG /> {t("auth_google")}
        </button>
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />{t("auth_or")}<div className="h-px flex-1 bg-border" /></div>
        <form onSubmit={submit} className="space-y-4">
          {signup && (
            <>
              <div><Label>{t("auth_name")}</Label><Input required value={f.name} onChange={set("name")} /></div>
              {!f.invite && <div><Label>{t("auth_business")}</Label><Input required value={f.business} onChange={set("business")} /></div>}
              <div><Label>{t("auth_invite")}</Label><Input value={f.invite} onChange={set("invite")} /></div>
            </>
          )}
          <div><Label>{t("auth_email")}</Label><Input type="email" required value={f.email} onChange={set("email")} /></div>
          <div><Label>{t("auth_password")}</Label><Input type="password" required minLength={8} value={f.password} onChange={set("password")} />
            {!signup && <button type="button" onClick={forgot} className="mt-2 text-xs font-semibold text-primary hover:underline">{t("auth_forgot")}</button>}
          </div>
          <Button type="submit" className="w-full" disabled={busy}>{signup ? t("auth_signup") : t("auth_login")}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {signup ? t("auth_have_account") : t("auth_no_account")}{" "}
          <button className="font-semibold text-primary" onClick={() => setSignup(!signup)}>{signup ? t("auth_login") : t("auth_signup")}</button>
        </p>
      </div>
    </div>
  );
}
