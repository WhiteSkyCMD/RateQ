import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/rateq/legal-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacybeleid – RateQ" },
      { name: "description", content: "Hoe RateQ persoonsgegevens verwerkt en beschermt (AVG)." },
      { property: "og:title", content: "Privacybeleid – RateQ" },
      { property: "og:description", content: "Hoe RateQ persoonsgegevens verwerkt en beschermt (AVG)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <LegalPage doc="privacy" />,
});
