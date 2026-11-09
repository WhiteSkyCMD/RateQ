import { describe, it, expect } from "vitest";
import { parseCustomerCsv } from "@/lib/csv";

describe("parseCustomerCsv", () => {
  it("reads semicolon file with header and converts 06 to +31", () => {
    expect(parseCustomerCsv("Naam;Telefoon;Email\nJan;06 12345678;jan@x.nl")).toEqual([{ name: "Jan", phone: "+31612345678", email: "jan@x.nl" }]);
  });
  it("works without header and skips invalid and duplicate numbers", () => {
    const r = parseCustomerCsv("Piet,0612345678\nKlaas,abc\nPiet2,+31612345678");
    expect(r).toHaveLength(1);
  });
});
