import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";
import { OwnerOnly } from "@/components/rateq/owner-only";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({ meta: [{ title: "Team – RateQ" }] }),
  component: () => <OwnerOnly><Team /></OwnerOnly>,
});

function Team() {
  const { t } = useI18n();
  const { data: ws } = useWorkspace();
  const b = ws!.business!;
  const qc = useQueryClient();
  const { data: members = [] } = useQuery({
    queryKey: ["members", b.id],
    queryFn: async () => {
      const { data: m } = await supabase.from("business_members").select("id, user_id, role").eq("business_id", b.id);
      const ids = (m ?? []).map((x) => x.user_id);
      const { data: p } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      return (m ?? []).map((x) => ({ ...x, profile: p?.find((y) => y.id === x.user_id) }));
    },
  });

  async function remove(id: string) {
    await supabase.from("business_members").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["members", b.id] });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("team_title")}</h1>
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold">{t("team_invite")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("team_invite_sub")}</p>
        <div className="mt-4 flex items-center gap-3">
          <code className="rounded-lg bg-secondary px-4 py-2 text-lg font-bold tracking-widest text-primary">{b.invite_code}</code>
          <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(b.invite_code); toast.success(t("copied")); }}><Copy /></Button>
        </div>
      </section>
      <section className="divide-y divide-border rounded-2xl border border-border bg-card">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between p-4">
            <div><p className="font-medium">{m.profile?.full_name ?? "—"}</p><p className="text-xs text-muted-foreground">{m.profile?.email}</p></div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">{m.role === "owner" ? t("role_owner") : t("role_staff")}</span>
              {m.role === "staff" && <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>{t("remove")}</Button>}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
