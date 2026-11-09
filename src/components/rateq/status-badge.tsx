import { useI18n, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const STYLE: Record<string, string> = {
  created: "bg-secondary text-muted-foreground",
  sent: "bg-secondary text-foreground",
  opened: "bg-chart-3/20 text-chart-3",
  redirected: "bg-primary/15 text-primary",
  intercepted: "bg-destructive/15 text-destructive",
  failed: "bg-destructive/15 text-destructive",
};
export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STYLE[status] ?? STYLE["sent"])}>{t(`st_${status}` as TKey) ?? status}</span>;
}
