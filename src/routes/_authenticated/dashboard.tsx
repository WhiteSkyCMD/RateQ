import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Send, TrendingUp, Star, ShieldAlert } from "lucide-react";
import { useWorkspace, requestsQuery } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";
import { OnboardingChecklist } from "@/components/rateq/onboarding";
import { SendRequestButton } from "@/components/rateq/send-request";
import { StatusBadge } from "@/components/rateq/status-badge";
import { Stars } from "@/components/rateq/brand";
import { PLATFORM_LABEL, type PlatformKey } from "@/lib/routing";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard – RateQ" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { t, lang } = useI18n();
  const { data: ws } = useWorkspace();
  const biz = ws?.business;
  const { data: reqs = [] } = useQuery({ ...requestsQuery(biz?.id ?? ""), enabled: !!biz });
  const isOwner = ws?.role === "owner";

  const stats = useMemo(() => {
    const rated = reqs.filter((r) => r.rating != null);
    const avg = rated.length ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length : 0;
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (29 - i));
      return { date: d, label: d.toLocaleDateString(lang, { day: "numeric", month: "short" }), public: 0, internal: 0 };
    });
    rated.forEach((r) => {
      const d = new Date(r.rated_at ?? r.created_at); d.setHours(0, 0, 0, 0);
      const slot = days.find((x) => x.date.getTime() === d.getTime());
      if (slot) (r.rating! >= 4 ? slot.public++ : slot.internal++);
    });
    const platforms: Record<PlatformKey, number> = { google: 0, trustpilot: 0, facebook: 0 };
    reqs.forEach((r) => { if (r.platform && r.platform in platforms) platforms[r.platform as PlatformKey]++; });
    return {
      sent: reqs.length,
      conv: reqs.length ? Math.round((rated.length / reqs.length) * 100) : 0,
      avg: avg.toFixed(1),
      caught: reqs.filter((r) => r.status === "intercepted").length,
      days, platforms,
      platformTotal: Object.values(platforms).reduce((a, b) => a + b, 0),
    };
  }, [reqs, lang]);

  if (!biz) return <p className="text-muted-foreground">{t("loading")}</p>;

  const kpis = [
    { label: t("kpi_sent"), value: stats.sent, icon: Send },
    { label: t("kpi_conv"), value: `${stats.conv}%`, icon: TrendingUp },
    { label: t("kpi_avg"), value: stats.avg, icon: Star, star: true },
    { label: t("kpi_caught"), value: stats.caught, icon: ShieldAlert },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("side_overview")}</h1>
          <p className="text-sm text-muted-foreground">{t("credits")}: <span className="font-semibold text-foreground">{biz.sms_credits}</span></p>
        </div>
        <SendRequestButton businessId={biz.id} size="lg" />
      </div>

      {isOwner && <OnboardingChecklist business={biz} requestCount={reqs.length} />}

      {isOwner && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between text-sm text-muted-foreground">{k.label}<k.icon className={k.star ? "h-4 w-4 text-star" : "h-4 w-4 text-primary"} /></div>
                <p className="mt-3 text-3xl font-bold">{k.value}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
              <h2 className="font-semibold">{t("chart_t")}</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer>
                  <AreaChart data={stats.days}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} /><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} interval={6} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                    <Area type="monotone" dataKey="public" name={t("routing_public")} stroke="var(--chart-1)" fill="url(#g1)" />
                    <Area type="monotone" dataKey="internal" name={t("routing_internal")} stroke="var(--chart-4)" fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-semibold">{t("platforms_t")}</h2>
              <div className="mt-6 space-y-5">
                {(Object.keys(stats.platforms) as PlatformKey[]).map((k) => {
                  const pct = stats.platformTotal ? Math.round((stats.platforms[k] / stats.platformTotal) * 100) : 0;
                  return (
                    <div key={k}>
                      <div className="flex justify-between text-sm"><span>{PLATFORM_LABEL[k]}</span><span className="text-muted-foreground">{stats.platforms[k]} · {pct}%</span></div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="rounded-2xl border border-border bg-card">
        <h2 className="border-b border-border p-5 font-semibold">{t("recent")}</h2>
        {reqs.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">{t("no_requests")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>{[t("col_customer"), t("col_status"), t("col_rating"), t("col_platform"), t("col_date")].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {reqs.slice(0, 50).map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-5 py-3"><p className="font-medium">{r.customer_name}</p><p className="text-xs text-muted-foreground">{r.customer_phone}</p></td>
                    <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-3">{r.rating ? <Stars value={r.rating} /> : "—"}</td>
                    <td className="px-5 py-3">{r.platform ? PLATFORM_LABEL[r.platform as PlatformKey] : "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString(lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
