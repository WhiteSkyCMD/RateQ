import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";

export function OwnerOnly({ children }: { children: React.ReactNode }) {
  const { data: ws, isLoading } = useWorkspace();
  const { t } = useI18n();
  if (isLoading) return <p className="text-muted-foreground">{t("loading")}</p>;
  if (ws?.role !== "owner" || !ws.business) return <p className="text-muted-foreground">{t("staff_only")}</p>;
  return <>{children}</>;
}
