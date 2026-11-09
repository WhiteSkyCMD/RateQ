import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace, requestsQuery } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";
import { Stars } from "@/components/rateq/brand";
import { OwnerOnly } from "@/components/rateq/owner-only";
import { cn } from "@/lib/utils";
import { Phone, Mail, Download } from "lucide-react";
import { toCsv, downloadCsv } from "@/lib/csv";

export const Route = createFileRoute("/_authenticated/feedback")({
  head: () => ({ meta: [{ title: "Interne feedback – RateQ" }] }),
  component: () => <OwnerOnly><Feedback /></OwnerOnly>,
});

function Feedback() {
  const { t, lang } = useI18n();
  const { data: ws } = useWorkspace();
  const biz = ws!.business!;
  const qc = useQueryClient();
  const { data: reqs = [] } = useQuery(requestsQuery(biz.id));
  const [showResolved, setShowResolved] = useState(false);
  const items = reqs.filter((r) => r.status === "intercepted" && r.resolved === showResolved);

  async function toggle(id: string, resolved: boolean) {
    await supabase.from("review_requests").update({ resolved }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["requests", biz.id] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("fb_title")}</h1>
        <p className="text-sm text-muted-foreground">{t("fb_sub")}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="inline-flex rounded-lg border border-border p-1 text-sm">
        {[false, true].map((v) => (
          <button key={String(v)} onClick={() => setShowResolved(v)} className={cn("rounded-md px-3 py-1.5", showResolved === v ? "bg-secondary font-semibold" : "text-muted-foreground")}>{v ? t("resolved") : t("open")}</button>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={() => {
        const all = reqs.filter((r) => r.status === "intercepted");
        if (!all.length) { toast.error(t("export_empty")); return; }
        downloadCsv("feedback.csv", toCsv([t("col_customer"), t("ct_phone"), t("cu_email"), t("col_rating"), "Feedback", t("col_status"), t("col_date")], all.map((r) => [r.customer_name, r.customer_phone, r.customer_email, r.rating, r.feedback, r.resolved ? t("resolved") : t("open"), new Date(r.rated_at ?? r.created_at).toLocaleString(lang)])));
      }}><Download /> {t("export_csv")}</Button>
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">{t("fb_empty")}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-semibold">{r.customer_name}</p>
                  {r.customer_phone && <a href={`tel:${r.customer_phone}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline"><Phone className="h-3.5 w-3.5" />{r.customer_phone}</a>}
                  {r.customer_email && <a href={`mailto:${r.customer_email}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline"><Mail className="h-3.5 w-3.5" />{r.customer_email}</a>}
                </div>
                <Stars value={r.rating ?? 0} />
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm">{r.feedback || "—"}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{new Date(r.rated_at ?? r.created_at).toLocaleString(lang)}</span>
                <Button size="sm" variant={r.resolved ? "outline" : "default"} onClick={() => toggle(r.id, !r.resolved)}>{r.resolved ? t("reopen") : t("resolve")}</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
