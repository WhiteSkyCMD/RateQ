import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Upload, Plus, Send, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";
import { parseCustomerCsv, normalizePhone, toCsv, downloadCsv, type CsvCustomer } from "@/lib/csv";
import { createReviewRequest } from "@/lib/reviews.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChannelSelect, type Channel } from "@/components/rateq/send-request";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/klanten")({
  head: () => ({ meta: [{ title: "Klanten – RateQ" }] }),
  component: Customers,
});

function Customers() {
  const { t, lang } = useI18n();
  const { data: ws } = useWorkspace();
  const biz = ws!.business!;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const send = useServerFn(createReviewRequest);
  const { data: rows = [] } = useQuery({
    queryKey: ["customers", biz.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").eq("business_id", biz.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const [q, setQ] = useState("");
  const [channel, setChannel] = useState<Channel>("sms");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<CsvCustomer[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [progress, setProgress] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const list = useMemo(() => {
    const s = q.toLowerCase();
    return rows.filter((r) => !s || r.name.toLowerCase().includes(s) || r.phone.includes(s));
  }, [rows, q]);
  const refresh = () => qc.invalidateQueries({ queryKey: ["customers", biz.id] });

  async function onFile(f: File) {
    const parsed = parseCustomerCsv(await f.text());
    if (!parsed.length) toast.error(t("cu_invalid"));
    else setPreview(parsed);
    if (fileRef.current) fileRef.current.value = "";
  }
  async function doImport() {
    if (!preview) return;
    const { error } = await supabase.from("customers").upsert(preview.map((p) => ({ ...p, business_id: biz.id })), { onConflict: "business_id,phone" });
    if (error) { toast.error(error.message); return; }
    toast.success(`${preview.length} ${t("cu_imported")}`);
    setPreview(null); refresh();
  }
  async function doAdd(e: React.FormEvent) {
    e.preventDefault();
    const phone = normalizePhone(form.phone);
    const { error } = await supabase.from("customers").upsert({ business_id: biz.id, name: form.name.trim(), phone, email: form.email || null }, { onConflict: "business_id,phone" });
    if (error) { toast.error(error.message); return; }
    setAdding(false); setForm({ name: "", phone: "", email: "" }); refresh();
  }
  async function doDelete() {
    const { error } = await supabase.from("customers").delete().in("id", [...sel]);
    if (error) { toast.error(error.message); return; }
    toast.success(t("cu_deleted")); setSel(new Set()); refresh();
  }
  async function doSend() {
    const targets = rows.filter((r) => sel.has(r.id));
    if (!confirm(`${targets.length} ${t("cu_confirm_send")}`)) return;
    let ok = 0, fail = 0;
    for (const [i, c] of targets.entries()) {
      setProgress(`${t("cu_sending")} ${i + 1}/${targets.length}`);
      try {
        const ch: Channel = channel !== "sms" && !c.email ? "sms" : channel;
        const r = await send({ data: { businessId: biz.id, name: c.name, phone: c.phone, email: c.email ?? "", channel: ch } });
        if (r.sms === "sent" || r.email === "sent") ok++; else { fail++; if (r.sms === "no_credits") { toast.error(t("sms_no_credits"), { action: { label: t("buy_now"), onClick: () => navigate({ to: "/abonnement", hash: "credits" }) } }); break; } }
      } catch (err) {
        fail++;
        if ((err as Error).message?.includes("TRIAL_EXPIRED")) { toast.error(t("trial_expired"), { action: { label: t("trial_choose"), onClick: () => navigate({ to: "/abonnement" }) } }); break; }
      }
    }
    setProgress(null); setSel(new Set());
    toast.success(`${t("cu_bulk_done")}: ${ok}${fail ? ` · ${fail} ${t("cu_bulk_failed")}` : ""}`);
    qc.invalidateQueries();
  }

  const allSel = list.length > 0 && list.every((r) => sel.has(r.id));
  const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB") : t("cu_never"));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("cu_title")}</h1>
          <p className="text-sm text-muted-foreground">{t("cu_sub")}</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <Button variant="outline" onClick={() => {
            if (!rows.length) { toast.error(t("export_empty")); return; }
            downloadCsv("klanten.csv", toCsv([t("ct_name"), t("ct_phone"), t("cu_email"), t("cu_last")], rows.map((r) => [r.name, r.phone, r.email, r.last_requested_at ? new Date(r.last_requested_at).toLocaleString(lang) : ""])));
          }}><Download /> {t("export_csv")}</Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}><Upload /> {t("cu_import")}</Button>
          <Button onClick={() => setAdding(true)}><Plus /> {t("cu_add")}</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input className="max-w-xs" placeholder={t("cu_search")} value={q} onChange={(e) => setQ(e.target.value)} />
        {sel.size > 0 && (
          <>
            <ChannelSelect value={channel} onChange={setChannel} />
            <Button disabled={!!progress} onClick={doSend} className="shadow-glow"><Send /> {progress ?? `${t("cu_send_sel")} (${sel.size})`}</Button>
            <Button variant="ghost" disabled={!!progress} onClick={doDelete}><Trash2 /> {t("cu_delete_sel")}</Button>
          </>
        )}
        <span className="ml-auto text-sm text-muted-foreground">{t("credits")}: <span className="font-semibold text-foreground">{biz.sms_credits}</span></span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {list.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">{t("cu_empty")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="w-10 p-3"><Checkbox checked={allSel} onCheckedChange={(v) => setSel(v ? new Set(list.map((r) => r.id)) : new Set())} /></th>
                <th className="p-3">{t("cust_name")}</th><th className="p-3">{t("cust_phone")}</th>
                <th className="hidden p-3 md:table-cell">{t("cu_email")}</th><th className="p-3">{t("cu_last")}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                  <td className="p-3"><Checkbox checked={sel.has(r.id)} onCheckedChange={(v) => { const n = new Set(sel); if (v) n.add(r.id); else n.delete(r.id); setSel(n); }} /></td>
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3 text-muted-foreground">{r.phone}</td>
                  <td className="hidden p-3 text-muted-foreground md:table-cell">{r.email ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{fmt(r.last_requested_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{t("cu_preview")} · {preview?.length} {t("cu_rows")}</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">{t("cu_import_help")}</p>
          <div className="max-h-80 overflow-auto rounded-md border border-border text-sm">
            <table className="w-full">
              <tbody>
                {preview?.slice(0, 50).map((p) => (
                  <tr key={p.phone} className="border-b border-border last:border-0"><td className="p-2">{p.name}</td><td className="p-2 text-muted-foreground">{p.phone}</td><td className="p-2 text-muted-foreground">{p.email ?? ""}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter><Button onClick={doImport}><Upload /> {t("cu_confirm_import")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("cu_add")}</DialogTitle></DialogHeader>
          <form onSubmit={doAdd} className="space-y-4">
            <div><Label>{t("cust_name")}</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>{t("cust_phone")}</Label><Input required type="tel" placeholder="06 12345678" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>{t("cu_email")}</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <Button type="submit" className="w-full">{t("cu_save")}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
