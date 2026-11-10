import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { adminCreatePromoCode, adminListPromoCodes, adminTogglePromoCode } from "@/lib/admin.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Dur = "once" | "repeating" | "forever";

export function PromoTab() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const list = useServerFn(adminListPromoCodes);
  const create = useServerFn(adminCreatePromoCode);
  const toggle = useServerFn(adminTogglePromoCode);
  const { data, isLoading, error } = useQuery({ queryKey: ["promo-codes"], queryFn: () => list() });

  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "amount">("percent");
  const [value, setValue] = useState("10");
  const [duration, setDuration] = useState<Dur>("once");
  const [months, setMonths] = useState("3");
  const [max, setMax] = useState("");
  const [exp, setExp] = useState("");

  const createM = useMutation({
    mutationFn: () => create({ data: { code, type, value: Number(value.replace(",", ".")), duration, months: Number(months), maxRedemptions: max ? Number(max) : undefined, expiresAt: exp || undefined } }),
    onSuccess: () => { toast.success(t("promo_created")); setCode(""); qc.invalidateQueries({ queryKey: ["promo-codes"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggleM = useMutation({
    mutationFn: (v: { id: string; active: boolean }) => toggle({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promo-codes"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const durLabel = (d: string, m: number | null) => d === "once" ? t("promo_once") : d === "forever" ? t("promo_forever") : `${m} ${t("promo_months").toLowerCase()}`;
  const fmtDate = (s: number) => new Date(s * 1000).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB");

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form className="space-y-3 rounded-xl border border-border bg-card p-5" onSubmit={(e) => { e.preventDefault(); createM.mutate(); }}>
        <h3 className="font-semibold">{t("promo_new")}</h3>
        <p className="text-xs text-muted-foreground">{t("promo_hint")}</p>
        <div className="space-y-1"><Label>{t("promo_code")}</Label><Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="START10" required /></div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1"><Label>{t("promo_type")}</Label>
            <Select value={type} onValueChange={(v) => setType(v as "percent" | "amount")}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="percent">{t("promo_pct")}</SelectItem><SelectItem value="amount">{t("promo_eur")}</SelectItem></SelectContent></Select></div>
          <div className="space-y-1"><Label>{t("promo_value")}</Label><Input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} required /></div>
        </div>
        <div className="space-y-1"><Label>{t("promo_dur")}</Label>
          <Select value={duration} onValueChange={(v) => setDuration(v as Dur)}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="once">{t("promo_once")}</SelectItem><SelectItem value="repeating">{t("promo_rep")}</SelectItem><SelectItem value="forever">{t("promo_forever")}</SelectItem></SelectContent></Select></div>
        {duration === "repeating" && <div className="space-y-1"><Label>{t("promo_months")}</Label><Input type="number" min={1} max={36} value={months} onChange={(e) => setMonths(e.target.value)} /></div>}
        <div className="space-y-1"><Label>{t("promo_max")}</Label><Input type="number" min={1} value={max} onChange={(e) => setMax(e.target.value)} /></div>
        <div className="space-y-1"><Label>{t("promo_exp")}</Label><Input type="date" value={exp} onChange={(e) => setExp(e.target.value)} /></div>
        <Button type="submit" className="w-full" disabled={createM.isPending}>{t("promo_create")}</Button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        {isLoading ? <p className="p-5 text-sm text-muted-foreground">…</p> : error ? <p className="p-5 text-sm text-destructive">{(error as Error).message}</p> : !data?.length ? <p className="p-5 text-sm text-muted-foreground">{t("promo_empty")}</p> : (
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr className="border-b border-border">
              <th className="p-3">{t("promo_code")}</th><th className="p-3">{t("promo_value")}</th><th className="p-3">{t("promo_dur")}</th><th className="p-3">{t("promo_used")}</th><th className="p-3">{t("promo_exp")}</th><th className="p-3">{t("promo_active")}</th>
            </tr></thead>
            <tbody>{data.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="p-3 font-mono font-semibold">{p.code}</td>
                <td className="p-3">{p.percentOff != null ? `${p.percentOff}%` : `€${((p.amountOff ?? 0) / 100).toFixed(2).replace(".", ",")}`}</td>
                <td className="p-3">{durLabel(p.duration, p.months)}</td>
                <td className="p-3">{p.timesRedeemed}{p.maxRedemptions ? ` / ${p.maxRedemptions}` : ""}</td>
                <td className="p-3">{p.expiresAt ? fmtDate(p.expiresAt) : "—"}</td>
                <td className="p-3"><Switch checked={p.active} onCheckedChange={(v) => toggleM.mutate({ id: p.id, active: v })} /></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
