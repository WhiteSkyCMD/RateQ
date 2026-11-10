import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { planCredits, isTrialExpired, trialDaysLeft } from "@/lib/plans";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, Contact, MessageSquareWarning, Settings, Users, CreditCard, ShieldCheck, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo, LangToggle } from "@/components/rateq/brand";
import { useI18n, type TKey } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { mode: undefined } });
  },
  component: AppShell,
});

type NavItem = { to: "/dashboard" | "/klanten" | "/feedback" | "/instellingen" | "/team" | "/abonnement" | "/admin"; label: TKey; icon: typeof LayoutDashboard; owner?: boolean; admin?: boolean };
const NAV: NavItem[] = [
  { to: "/dashboard", label: "side_overview", icon: LayoutDashboard },
  { to: "/klanten", label: "side_customers", icon: Contact },
  { to: "/feedback", label: "side_feedback", icon: MessageSquareWarning, owner: true },
  { to: "/instellingen", label: "side_settings", icon: Settings, owner: true },
  { to: "/team", label: "side_team", icon: Users, owner: true },
  { to: "/abonnement", label: "side_billing", icon: CreditCard, owner: true },
  { to: "/admin", label: "side_admin", icon: ShieldCheck, admin: true },
];

function AppShell() {
  const { t } = useI18n();
  const { data: ws } = useWorkspace();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const isOwner = ws?.role === "owner";
  const items = NAV.filter((n) => (n.admin ? ws?.isSuperAdmin : n.owner ? isOwner : true));

  async function logout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { mode: undefined }, replace: true });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 md:flex">
        <Logo className="px-2 py-2" />
        <div className="mt-6 rounded-xl bg-sidebar-accent p-3">
          <p className="truncate text-sm font-semibold">{ws?.business?.name ?? "…"}</p>
          <p className="text-xs text-muted-foreground">{ws?.isSuperAdmin ? t("role_super_admin") : ws?.role === "owner" ? t("role_owner") : t("role_staff")}</p>
        </div>
        {ws?.business && <CreditMeter credits={ws.business.sms_credits} plan={ws.business.plan} createdAt={ws.business.created_at} />}
        <nav className="mt-6 flex-1 space-y-1">
          {items.map((n) => (
            <Link key={n.to} to={n.to} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              activeProps={{ className: "bg-sidebar-accent text-foreground font-semibold" }}>
              <n.icon className="h-4 w-4" /> {t(n.label)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-between">
          <LangToggle />
          <button onClick={logout} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><LogOut className="h-4 w-4" />{t("logout")}</button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border p-3 md:hidden">
          <Logo compact />
          <div className="flex items-center gap-2"><LangToggle /><button onClick={logout} aria-label={t("logout")}><LogOut className="h-5 w-5" /></button></div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-border px-2 py-2 md:hidden">
          {items.map((n) => (
            <Link key={n.to} to={n.to} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-muted-foreground" activeProps={{ className: "bg-secondary text-foreground" }}>{t(n.label)}</Link>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}


function CreditMeter({ credits, plan, createdAt }: { credits: number; plan: string; createdAt: string }) {
  const { t } = useI18n();
  const total = Math.max(planCredits(plan), credits);
  const used = Math.max(total - credits, 0);
  const pct = total ? Math.round((credits / total) * 100) : 0;
  return (
    <div className="mt-3 rounded-xl border border-sidebar-border p-3">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">{t("credit_meter")}</span>
        <span className="font-semibold">{used} / {total} {t("credit_used")}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className={pct < 20 ? "h-full rounded-full bg-destructive" : "h-full rounded-full bg-primary"} style={{ width: `${pct}%` }} />
      </div>
      {plan === "demo" && (
        <p className={isTrialExpired(plan, createdAt) ? "mt-2 text-xs font-semibold text-destructive" : "mt-2 text-xs text-muted-foreground"}>
          {isTrialExpired(plan, createdAt) ? t("trial_expired") : t("trial_left").replace("{n}", String(trialDaysLeft(createdAt)))}
        </p>
      )}
      <Link to="/abonnement" hash="credits" className="mt-2 block text-xs font-semibold text-primary hover:underline">{t("credit_upgrade")} →</Link>
    </div>
  );
}
