export type PlatformKey = "google" | "trustpilot" | "facebook";
export type RoutingSettings = {
  google_url: string | null; google_enabled: boolean;
  trustpilot_url: string | null; trustpilot_enabled: boolean;
  facebook_url: string | null; facebook_enabled: boolean;
};

/** 4–5 stars go public, 1–3 stay internal. */
export function isPublicRating(rating: number) {
  return rating >= 4;
}

/** Enabled platforms that have a review URL, in fixed order. */
export function activePlatforms(b: RoutingSettings): { key: PlatformKey; url: string }[] {
  const out: { key: PlatformKey; url: string }[] = [];
  (["google", "trustpilot", "facebook"] as const).forEach((k) => {
    const url = b[`${k}_url`];
    if (b[`${k}_enabled`] && url) out.push({ key: k, url });
  });
  return out;
}

/** Fixed SMS text — businesses cannot customize it. */
export const DEFAULT_SMS_TEMPLATE = "Hoi {naam}, bedankt voor je bezoek aan {bedrijf}! Zou je ons willen beoordelen? {link}";

/** Fixed reminder text, sent once when a request is unanswered after REMINDER_AFTER_MS. */
export const REMINDER_SMS_TEMPLATE = "Hoi {naam}, een kleine herinnering van {bedrijf}: we horen graag hoe je het vond! {link}";
export const REMINDER_AFTER_MS = 48 * 60 * 60 * 1000;

export function renderSms(template: string, vars: { naam: string; bedrijf: string; link: string }) {
  return template.replaceAll("{naam}", vars.naam).replaceAll("{bedrijf}", vars.bedrijf).replaceAll("{link}", vars.link);
}

export const PLATFORM_LABEL: Record<PlatformKey, string> = { google: "Google", trustpilot: "Trustpilot", facebook: "Facebook" };
