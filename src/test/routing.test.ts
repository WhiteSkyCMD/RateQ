import { describe, it, expect } from "vitest";
import { isPublicRating, activePlatforms, renderSms } from "@/lib/routing";

describe("review routing", () => {
  it("4 and 5 stars go public", () => {
    expect(isPublicRating(4)).toBe(true);
    expect(isPublicRating(5)).toBe(true);
  });
  it("1 to 3 stars stay internal", () => {
    expect([1, 2, 3].map(isPublicRating)).toEqual([false, false, false]);
  });
  it("only enabled platforms with a link are used", () => {
    const r = activePlatforms({ google_url: "https://g", google_enabled: false, trustpilot_url: "https://t", trustpilot_enabled: true, facebook_url: null, facebook_enabled: true });
    expect(r).toEqual([{ key: "trustpilot", url: "https://t" }]);
  });
  it("fills sms template", () => {
    expect(renderSms("Hoi {naam} van {bedrijf}: {link}", { naam: "Jan", bedrijf: "Bakker", link: "x" })).toBe("Hoi Jan van Bakker: x");
  });
});

import { creditPackCents } from "@/lib/plans";
describe("credit top-up price", () => {
  it("charges €0,08 per message on Business", async () => {
    const { creditPackCents } = await import("@/lib/plans");
    expect(creditPackCents(100, "business")).toBe(800);
    expect(creditPackCents(100, "starter")).toBe(1000);
  });
  it("charges €0,10 per message", () => {
    expect(creditPackCents(1)).toBe(10);
    expect(creditPackCents(100)).toBe(1000);
  });
});

import { REMINDER_AFTER_MS } from "@/lib/routing";
describe("customer reminder", () => {
  it("fires after 48 hours", () => {
    expect(REMINDER_AFTER_MS).toBe(48 * 60 * 60 * 1000);
  });
});
