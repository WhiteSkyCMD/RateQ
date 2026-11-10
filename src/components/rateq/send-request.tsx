import { useWorkspace } from "@/lib/workspace";
import { isTrialExpired } from "@/lib/plans";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Send, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createReviewRequest } from "@/lib/reviews.functions";
import { useI18n } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type Channel = "sms" | "email" | "both";

export function ChannelSelect({ value, onChange }: { value: Channel; onChange: (c: Channel) => void }) {
  const { t } = useI18n();
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Channel)}>
      <SelectTrigger className="w-40" aria-label={t("ch_label")}><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="sms">{t("ch_sms")}</SelectItem>
        <SelectItem value="email">{t("ch_email")}</SelectItem>
        <SelectItem value="both">{t("ch_both")}</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function SendRequestButton({ businessId, size = "default" }: { businessId: string; size?: "default" | "lg" }) {
  const { t } = useI18n();
  const create = useServerFn(createReviewRequest);
  const { data: ws } = useWorkspace();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener("rateq:open-send", h);
    return () => window.removeEventListener("rateq:open-send", h);
  }, []);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [channel, setChannel] = useState<Channel>("sms");
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [status, setStatus] = useState<{ sms: "sent" | "failed" | "no_credits" | "skipped"; email: "sent" | "failed" | "skipped"; error: string | null } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await create({ data: { businessId, name, phone, email, channel } });
      setLink(`${window.location.origin}/r/${r.token}`);
      setStatus({ sms: r.sms, email: r.email, error: r.error });
      if (r.sms === "sent") toast.success(t("sms_sent"));
      else if (r.sms !== "skipped") toast.error(r.sms === "no_credits" ? t("sms_no_credits") : t("sms_failed"));
      if (r.email === "sent") toast.success(t("email_sent"));
      else if (r.email === "failed") toast.error(t("email_failed"));
      qc.invalidateQueries();
    } catch (err) {
      const msg = (err as Error).message;
      toast.error(msg.includes("TRIAL_EXPIRED") ? t("trial_expired") : msg);
    } finally {
      setBusy(false);
    }
  }

  const biz = ws?.business;
  const expired = !!biz && isTrialExpired(biz.plan, biz.created_at);

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setLink(null); setStatus(null); setName(""); setPhone(""); setEmail(""); } }}>
      <DialogTrigger asChild><Button size={size} className="shadow-glow"><Send /> {t("send_new")}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("send_title")}</DialogTitle></DialogHeader>
        {expired && !link ? (
          <div className="space-y-3">
            <p className="font-semibold">{t("trial_expired")}</p>
            <p className="text-sm text-muted-foreground">{t("trial_expired_d")}</p>
            {ws?.role === "owner" && <Button asChild className="w-full"><Link to="/abonnement" onClick={() => setOpen(false)}>{t("trial_choose")}</Link></Button>}
          </div>
        ) : link ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {status?.sms === "sent" || status?.email === "sent" ? t("sms_sent_desc") : status?.sms === "no_credits" ? t("sms_no_credits_desc") : t("sms_failed_desc")}
            </p>
            {status?.sms === "no_credits" && <Button asChild className="w-full"><Link to="/abonnement" hash="credits" onClick={() => setOpen(false)}>{t("buy_now")}</Link></Button>}
            {status?.error && <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">{status.error}</p>}
            <div className="flex gap-2">
              <Input readOnly value={link} />
              <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(link); toast.success(t("copied")); }}><Copy /> {t("copy_link")}</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div><Label>{t("cust_name")}</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>{t("ch_label")}</Label><div className="mt-1"><ChannelSelect value={channel} onChange={setChannel} /></div></div>
            {channel !== "email" && <div><Label>{t("cust_phone")}</Label><Input required type="tel" placeholder="+31 6 12345678" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>}
            {channel !== "sms" && <div><Label>{t("cu_email")}</Label><Input required type="email" placeholder="klant@voorbeeld.nl" value={email} onChange={(e) => setEmail(e.target.value)} /></div>}
            <Button type="submit" className="w-full" disabled={busy}><Send /> {t("send")}</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
