import { COMPANY } from "@/lib/legal";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Logo, LangToggle } from "./brand";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/auth";
import { FEATURES } from "@/components/marketing/features";

function FeaturesMenu() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 hover:text-foreground" aria-expanded={open}>
        {t("nav_features")} <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-50 w-[640px] -translate-x-1/2 pt-3">
          <div className="rounded-2xl border border-border bg-popover p-4 shadow-glow">
            <div className="grid grid-cols-2 gap-1">
              {FEATURES.map((f) => (
                <Link key={f.id} to="/functies" hash={f.id} onClick={() => setOpen(false)} className="flex gap-3 rounded-xl p-3 transition-colors hover:bg-secondary">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><f.icon className="h-5 w-5" /></span>
                  <span>
                    <span className="block text-sm font-semibold text-foreground">{t(f.t)}</span>
                    <span className="block text-xs text-muted-foreground">{t(f.d)}</span>
                  </span>
                </Link>
              ))}
            </div>
            <Link to="/functies" onClick={() => setOpen(false)} className="mt-2 block rounded-xl bg-secondary/60 px-4 py-2.5 text-center text-sm font-semibold text-primary hover:bg-secondary">{t("nav_more")} →</Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const { t } = useI18n();
  const session = useSession();
  const links = [
    { to: "/hoe-het-werkt" as const, label: t("nav_how") },
    { to: "/prijzen" as const, label: t("nav_pricing") },
    { to: "/contact" as const, label: t("nav_contact") },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground lg:flex">
          <FeaturesMenu />
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>{l.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LangToggle />
          {session ? (
            <Button asChild size="sm"><Link to="/dashboard">{t("nav_dashboard")}</Link></Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to="/auth" search={{ mode: undefined }}>{t("nav_login")}</Link></Button>
              <Button asChild size="sm"><Link to="/auth" search={{ mode: "signup" }}>{t("nav_start")}</Link></Button>
            </>
          )}
          <Sheet>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu"><Menu /></Button></SheetTrigger>
            <SheetContent>
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <nav className="mt-8 flex flex-col gap-1">
                <p className="px-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("nav_features")}</p>
                {FEATURES.map((f) => (
                  <Link key={f.id} to="/functies" hash={f.id} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-secondary"><f.icon className="h-4 w-4 text-primary" />{t(f.t)}</Link>
                ))}
                <div className="my-3 border-t border-border" />
                {links.map((l) => <Link key={l.to} to={l.to} className="rounded-lg px-2 py-2 font-semibold hover:bg-secondary">{l.label}</Link>)}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">{t("ft_about")}</p>
          <LangToggle className="mt-4" />
        </div>
        <div>
          <p className="text-sm font-bold">{t("ft_product")}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {FEATURES.slice(0, 4).map((f) => <li key={f.id}><Link to="/functies" hash={f.id} className="hover:text-foreground">{t(f.t)}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold">{t("ft_company")}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/hoe-het-werkt" className="hover:text-foreground">{t("nav_how")}</Link></li>
            <li><Link to="/prijzen" className="hover:text-foreground">{t("nav_pricing")}</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">{t("nav_contact")}</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold">{t("nav_dashboard")}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth" search={{ mode: undefined }} className="hover:text-foreground">{t("nav_login")}</Link></li>
            <li><Link to="/auth" search={{ mode: "signup" }} className="hover:text-foreground">{t("nav_start")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="space-y-2 border-t border-border py-6 text-center text-xs text-muted-foreground">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          <Link to="/privacy" className="hover:text-foreground">{t("ft_privacy")}</Link>
          <Link to="/voorwaarden" className="hover:text-foreground">{t("ft_terms")}</Link>
          <Link to="/verwerkersovereenkomst" className="hover:text-foreground">{t("ft_dpa")}</Link>
        </div>
        <p>© {new Date().getFullYear()} RateQ · {COMPANY.name} · KvK {COMPANY.kvk} · {t("legal_vat")} {COMPANY.vat}</p>
        <p>{t("footer")} · {t("ft_rights")}</p>
      </div>
    </footer>
  );
}
