import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";
import { OwnerOnly } from "@/components/rateq/owner-only";
import { PLATFORM_LABEL } from "@/lib/routing";

export const Route = createFileRoute("/_authenticated/instellingen")({
  head: () => ({ meta: [{ title: "Instellingen – RateQ" }] }),
  component: () => <OwnerOnly><Settings /></OwnerOnly>,
});

function Settings() {
  const { t } = useI18n();
  const { data: ws } = useWorkspace();
  const b = ws!.business!;
  const qc = useQueryClient();
  const [f, setF] = useState({
    name: b.name, sms_sender_name: b.sms_sender_name ?? "",
    google_url: b.google_url ?? "", google_enabled: b.google_enabled,
    trustpilot_url: b.trustpilot_url ?? "", trustpilot_enabled: b.trustpilot_enabled,
    facebook_url: b.facebook_url ?? "", facebook_enabled: b.facebook_enabled,
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("businesses").update({
      ...f,
      sms_sender_name: f.sms_sender_name.replace(/[^A-Za-z0-9 ]/g, "").slice(0, 11),
      google_url: f.google_url || null, trustpilot_url: f.trustpilot_url || null, facebook_url: f.facebook_url || null,
    }).eq("id", b.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("saved"));
    qc.invalidateQueries({ queryKey: ["workspace"] });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("set_title")}</h1>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold">{t("routing_t")}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4">
            <span className="text-star">★★★★★</span><span className="text-sm">{t("routing_high")}</span><ArrowRight className="h-4 w-4 text-primary" /><span className="text-sm font-semibold text-primary">{t("routing_public")}</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <span className="text-star">★★★</span><span className="text-sm">{t("routing_low")}</span><ArrowRight className="h-4 w-4 text-destructive" /><span className="text-sm font-semibold text-destructive">{t("routing_internal")}</span>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold">{t("set_business")}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>{t("auth_business")}</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div><h2 className="font-semibold">{t("set_platforms")}</h2><p className="text-sm text-muted-foreground">{t("set_platforms_sub")}</p></div>
        {(["google", "trustpilot", "facebook"] as const).map((k) => (
          <div key={k} className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center">
            <div className="flex w-36 items-center gap-3">
              <Switch checked={f[`${k}_enabled`]} onCheckedChange={(v) => setF({ ...f, [`${k}_enabled`]: v })} />
              <span className="font-medium">{PLATFORM_LABEL[k]}</span>
            </div>
            <Input placeholder={t("url_ph")} value={f[`${k}_url`]} onChange={(e) => setF({ ...f, [`${k}_url`]: e.target.value })} />
          </div>
        ))}
      </section>

      <Button onClick={save} disabled={busy} size="lg">{t("save")}</Button>
    </div>
  );
}
