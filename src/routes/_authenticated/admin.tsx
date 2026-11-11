import { PLATFORM_LABEL } from "@/lib/routing";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";
import { adminOverview, adminSetMemberRole, adminSetSuperAdmin, adminUpdateBusiness } from "@/lib/admin.functions";
import { PLANS } from "@/lib/plans";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PromoTab } from "@/components/rateq/promo-codes";
import { StatusBadge } from "@/components/rateq/status-badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin – RateQ" }, { name: "description", content: "RateQ platform admin" }] }),
  component: Admin,
});

type Overview = Awaited<ReturnType<typeof adminOverview>>;

function Admin() {
  const { t } = useI18n();
  const { data: ws } = useWorkspace();
  const fetchOverview = useServerFn(adminOverview);
  const { data, isLoading } = useQuery({ queryKey: ["admin-overview"], enabled: !!ws?.isSuperAdmin, queryFn: () => fetchOverview() });
  if (!ws?.isSuperAdmin) return <p className="text-muted-foreground">{t("staff_only")}</p>;
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">{t("admin_title")}</h1><p className="text-sm text-muted-foreground">{t("admin_sub")}</p></div>
      {isLoading || !data ? <p className="text-muted-foreground">…</p> : (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">{t("adm_overview")}</TabsTrigger>
            <TabsTrigger value="businesses">{t("adm_businesses")}</TabsTrigger>
            <TabsTrigger value="users">{t("adm_users")}</TabsTrigger>
            <TabsTrigger value="activity">{t("adm_activity")}</TabsTrigger>
            <TabsTrigger value="contact">{t("adm_contact")}</TabsTrigger>
            <TabsTrigger value="promo">{t("adm_promo")}</TabsTrigger>
          </TabsList>
          <TabsContent value="overview"><OverviewTab d={data} /></TabsContent>
          <TabsContent value="businesses"><BusinessesTab d={data} /></TabsContent>
          <TabsContent value="users"><UsersTab d={data} me={ws.user.id} /></TabsContent>
          <TabsContent value="activity"><ActivityTab d={data} /></TabsContent>
          <TabsContent value="contact"><ContactTab /></TabsContent>
          <TabsContent value="promo"><PromoTab /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

const card = "rounded-2xl border border-border bg-card";
const th = "px-4 py-3 font-medium";
const td = "px-4 py-3";

function OverviewTab({ d }: { d: Overview }) {
  const { t } = useI18n();
  const rated = d.requests.filter((r) => r.rating != null);
  const avg = rated.length ? (rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length).toFixed(1) : "–";
  const kpis = [
    [t("adm_k_biz"), d.businesses.length], [t("adm_k_users"), d.profiles.length],
    [t("adm_k_sent"), d.requests.length], [t("adm_k_rated"), rated.length],
    [t("adm_k_public"), d.requests.filter((r) => r.platform).length], [t("adm_k_avg"), avg],
    [t("adm_k_credits"), d.businesses.reduce((s, b) => s + b.sms_credits, 0)], [t("adm_k_failed"), d.requests.filter((r) => r.status === "failed").length],
  ] as const;
  return (
    <div className="mt-4 space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map(([l, v]) => (<div key={l} className={`${card} p-5`}><p className="text-xs text-muted-foreground">{l}</p><p className="mt-1 text-2xl font-bold">{v}</p></div>))}
      </div>
      <div className={`${card} p-5`}>
        <h2 className="mb-4 font-semibold">{t("adm_plans")}</h2>
        <div className="grid grid-cols-3 gap-4">
          {PLANS.map((p) => {
            const n = d.businesses.filter((b) => b.plan === p.id).length;
            const pct = d.businesses.length ? (n / d.businesses.length) * 100 : 0;
            return (<div key={p.id}><div className="flex justify-between text-sm"><span>{t(p.name)}</span><span className="font-semibold">{n}</span></div>
              <div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} /></div></div>);
          })}
        </div>
      </div>
    </div>
  );
}

function BusinessesTab({ d }: { d: Overview }) {
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Overview["businesses"][number] | null>(null);
  const prof = useMemo(() => new Map(d.profiles.map((p) => [p.id, p])), [d.profiles]);
  const list = d.businesses.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()) || (prof.get(b.owner_id)?.email ?? "").toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="mt-4 space-y-4">
      <Input placeholder={t("adm_search")} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground"><tr><th className={th}>{t("adm_business")}</th><th className={th}>{t("adm_owner")}</th><th className={th}>Plan</th><th className={th}>{t("credits")}</th><th className={th}>{t("kpi_sent")}</th><th className={th}>{t("adm_members")}</th><th className={th}>{t("col_date")}</th><th className={th} /></tr></thead>
          <tbody>
            {list.map((b) => (
              <tr key={b.id} className="border-t border-border">
                <td className={`${td} font-medium`}>{b.name}</td>
                <td className={`${td} text-muted-foreground`}>{prof.get(b.owner_id)?.email ?? "–"}</td>
                <td className={`${td} capitalize`}>{b.plan}</td>
                <td className={td}>{b.sms_credits}</td>
                <td className={td}>{d.requests.filter((r) => r.business_id === b.id).length}</td>
                <td className={td}>{d.members.filter((m) => m.business_id === b.id).length}</td>
                <td className={`${td} text-muted-foreground`}>{new Date(b.created_at).toLocaleDateString(lang)}</td>
                <td className={td}><Button size="sm" variant="outline" onClick={() => setEdit(b)}>{t("adm_edit")}</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && <EditBusiness d={d} b={edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function EditBusiness({ d, b, onClose }: { d: Overview; b: Overview["businesses"][number]; onClose: () => void }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [plan, setPlan] = useState(b.plan);
  const [credits, setCredits] = useState(String(b.sms_credits));
  const [f, setF] = useState({
    name: b.name,
    google_url: b.google_url ?? "", google_enabled: b.google_enabled,
    trustpilot_url: b.trustpilot_url ?? "", trustpilot_enabled: b.trustpilot_enabled,
    facebook_url: b.facebook_url ?? "", facebook_enabled: b.facebook_enabled,
  });
  const update = useServerFn(adminUpdateBusiness);
  const setRole = useServerFn(adminSetMemberRole);
  const save = useMutation({
    mutationFn: () => update({ data: { businessId: b.id, plan, smsCredits: Number(credits), ...f } }),
    onSuccess: () => { toast.success(t("adm_saved")); qc.invalidateQueries({ queryKey: ["admin-overview"] }); onClose(); },
    onError: (e: Error) => toast.error(e.message || t("adm_error_generic")),
  });
  const role = useMutation({
    mutationFn: (v: { memberId: string; role: "owner" | "staff" }) => setRole({ data: v }),
    onSuccess: () => { toast.success(t("adm_saved")); qc.invalidateQueries({ queryKey: ["admin-overview"] }); },
    onError: (e: Error) => toast.error(e.message || t("adm_error_generic")),
  });
  const prof = new Map(d.profiles.map((p) => [p.id, p]));
  const members = d.members.filter((m) => m.business_id === b.id);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{b.name}</DialogTitle></DialogHeader>
        <div><p className="mb-1 text-xs text-muted-foreground">{t("auth_business")}</p><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="space-y-2">
          <p className="text-sm font-semibold">{t("set_platforms")}</p>
          {(["google", "trustpilot", "facebook"] as const).map((k) => (
            <div key={k} className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center">
              <div className="flex w-32 items-center gap-2">
                <Switch checked={f[`${k}_enabled`]} onCheckedChange={(v) => setF({ ...f, [`${k}_enabled`]: v })} />
                <span className="text-sm font-medium">{PLATFORM_LABEL[k]}</span>
              </div>
              <Input placeholder={t("url_ph")} value={f[`${k}_url`]} onChange={(e) => setF({ ...f, [`${k}_url`]: e.target.value })} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><p className="mb-1 text-xs text-muted-foreground">Plan</p>
            <Select value={plan} onValueChange={setPlan}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PLANS.map((p) => <SelectItem key={p.id} value={p.id}>{t(p.name)}</SelectItem>)}</SelectContent></Select></div>
          <div><p className="mb-1 text-xs text-muted-foreground">{t("credits")}</p><Input type="number" min={0} value={credits} onChange={(e) => setCredits(e.target.value)} /></div>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>{t("adm_save")}</Button>
        <div className="mt-2 space-y-2">
          <p className="text-sm font-semibold">{t("adm_members")}</p>
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{prof.get(m.user_id)?.email ?? m.user_id}</span>
              <Select value={m.role} onValueChange={(v) => role.mutate({ memberId: m.id, role: v as "owner" | "staff" })}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="owner">{t("adm_role_owner")}</SelectItem><SelectItem value="staff">{t("adm_role_staff")}</SelectItem></SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UsersTab({ d, me }: { d: Overview; me: string }) {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const setSuper = useServerFn(adminSetSuperAdmin);
  const setRole = useServerFn(adminSetMemberRole);
  const opts = { onSuccess: () => { toast.success(t("adm_saved")); qc.invalidateQueries({ queryKey: ["admin-overview"] }); }, onError: (e: Error) => toast.error(e.message || t("adm_error_generic")) };
  const sup = useMutation({ mutationFn: (v: { userId: string; enabled: boolean }) => setSuper({ data: v }), ...opts });
  const role = useMutation({ mutationFn: (v: { memberId: string; role: "owner" | "staff" }) => setRole({ data: v }), ...opts });
  const biz = new Map(d.businesses.map((b) => [b.id, b.name]));
  const list = d.profiles.filter((p) => `${p.full_name} ${p.email}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="mt-4 space-y-4">
      <Input placeholder={t("adm_search")} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground"><tr><th className={th}>{t("adm_name")}</th><th className={th}>{t("adm_email")}</th><th className={th}>{t("adm_business")}</th><th className={th}>{t("adm_role")}</th><th className={th}>{t("adm_super")}</th><th className={th}>{t("col_date")}</th></tr></thead>
          <tbody>
            {list.map((p) => {
              const m = d.members.find((x) => x.user_id === p.id);
              const isSuper = d.roles.some((r) => r.user_id === p.id && r.role === "super_admin");
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className={`${td} font-medium`}>{p.full_name ?? "–"}</td>
                  <td className={`${td} text-muted-foreground`}>{p.email}</td>
                  <td className={td}>{m ? biz.get(m.business_id) : t("adm_none")}</td>
                  <td className={td}>{m ? (
                    <Select value={m.role} onValueChange={(v) => role.mutate({ memberId: m.id, role: v as "owner" | "staff" })}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="owner">{t("adm_role_owner")}</SelectItem><SelectItem value="staff">{t("adm_role_staff")}</SelectItem></SelectContent>
                    </Select>) : "–"}</td>
                  <td className={td}><Switch checked={isSuper} disabled={p.id === me} onCheckedChange={(v) => sup.mutate({ userId: p.id, enabled: v })} /></td>
                  <td className={`${td} text-muted-foreground`}>{new Date(p.created_at).toLocaleDateString(lang)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActivityTab({ d }: { d: Overview }) {
  const { t, lang } = useI18n();
  const biz = new Map(d.businesses.map((b) => [b.id, b.name]));
  return (
    <div className={`${card} mt-4 overflow-x-auto`}>
      <table className="w-full text-sm">
        <thead className="text-left text-muted-foreground"><tr><th className={th}>{t("col_date")}</th><th className={th}>{t("adm_business")}</th><th className={th}>{t("adm_customer")}</th><th className={th}>{t("adm_status")}</th><th className={th}>{t("adm_rating")}</th><th className={th}>{t("adm_error")}</th></tr></thead>
        <tbody>
          {d.requests.slice(0, 100).map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className={`${td} text-muted-foreground`}>{new Date(r.created_at).toLocaleString(lang)}</td>
              <td className={td}>{biz.get(r.business_id)}</td>
              <td className={td}>{r.customer_name}</td>
              <td className={td}><StatusBadge status={r.status} /></td>
              <td className={td}>{r.rating ?? "–"}</td>
              <td className={`${td} max-w-xs truncate text-destructive`}>{r.error ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContactTab() {
  const { t } = useI18n();
  const { data = [] } = useQuery({
    queryKey: ["admin-contact"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });
  if (!data.length) return <p className="text-muted-foreground">{t("adm_contact_empty")}</p>;
  return (
    <div className="space-y-3">
      {data.map((m) => (
        <div key={m.id} className={`${card} p-5`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-semibold">{m.name}{m.company ? ` · ${m.company}` : ""}</p>
            <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
          </div>
          <p className="text-sm text-muted-foreground"><a href={`mailto:${m.email}`} className="text-primary hover:underline">{m.email}</a>{m.phone ? ` · ${m.phone}` : ""}</p>
          <p className="mt-3 whitespace-pre-wrap text-sm">{m.message}</p>
        </div>
      ))}
    </div>
  );
}
