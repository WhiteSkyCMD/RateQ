import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/rateq/legal-page";

export const Route = createFileRoute("/voorwaarden")({
  head: () => ({
    meta: [
      { title: "Algemene voorwaarden – RateQ" },
      { name: "description", content: "De algemene voorwaarden voor het gebruik van RateQ." },
      { property: "og:title", content: "Algemene voorwaarden – RateQ" },
      { property: "og:description", content: "De algemene voorwaarden voor het gebruik van RateQ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <LegalPage doc="terms" />,
});
