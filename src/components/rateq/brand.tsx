import { Link } from "@tanstack/react-router";
import icon from "@/assets/rateq-icon.png";
import wordmark from "@/assets/rateq-wordmark.png";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)} aria-label="RateQ">
      <img src={icon} alt="" className="h-9 w-auto" />
      {!compact && <img src={wordmark} alt="RateQ – Reputatie automatisering" className="h-7 w-auto" />}
    </Link>
  );
}

export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div className={cn("inline-flex rounded-full border border-border bg-secondary/60 p-0.5 text-xs font-semibold", className)}>
      {(["nl", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={cn("rounded-full px-2.5 py-1 uppercase transition-colors", lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5 text-star", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= value ? "" : "opacity-25"}>★</span>
      ))}
    </span>
  );
}
