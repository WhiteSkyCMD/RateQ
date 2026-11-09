import type { TKey } from "./i18n";

// Prices in EUR. Credits = included messages (per month; demo = one-time).
export type PlanId = "demo" | "starter" | "business";
export const PLANS: {
  id: PlanId; name: TKey; desc: TKey; badge?: TKey; price: number; yearly: number; credits: number; features: TKey[]; popular?: boolean;
}[] = [
  { id: "demo", name: "plan_demo", desc: "plan_demo_d", badge: "badge_demo", price: 0, yearly: 0, credits: 15, features: ["pf_demo1", "pf_demo2", "pf_demo3", "pf_demo4", "pf_demo5"] },
  { id: "starter", name: "plan_starter", desc: "plan_starter_d", price: 19.95, yearly: 15.95, credits: 30, features: ["pf_st1", "pf_st2", "pf_st3", "pf_st4", "pf_st5", "pf_st7"], popular: true },
  { id: "business", name: "plan_business", desc: "plan_business_d", price: 69, yearly: 55, credits: 200, features: ["pf_bu1", "pf_bu2", "pf_bu3", "pf_bu4", "pf_bu5", "pf_bu6", "pf_bu7"] },
];

export const planCredits = (id: string | null | undefined) => PLANS.find((p) => p.id === id)?.credits ?? PLANS[0]!.credits;

export function formatEuro(n: number, lang: string) {
  return new Intl.NumberFormat(lang === "en" ? "en-IE" : "nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: n % 1 ? 2 : 0 }).format(n);
}

/** Price per extra message credit in euro cents (top-up). */
export const CREDIT_PRICE_CENTS = 10;
/** Business plan pays less per extra credit. */
export const BUSINESS_CREDIT_PRICE_CENTS = 8;
export const CREDIT_PACKS = [50, 100, 250, 500] as const;
export function creditPriceCents(plan?: string | null): number {
  return plan === "business" ? BUSINESS_CREDIT_PRICE_CENTS : CREDIT_PRICE_CENTS;
}
export function creditPackCents(qty: number, plan?: string | null): number {
  return Math.max(0, Math.floor(qty)) * creditPriceCents(plan);
}
