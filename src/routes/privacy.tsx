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
      { property: "og:url", content: "https://www.rateq.nl/privacy" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://www.rateq.nl/privacy" }],
  }),
  component: () => <LegalPage doc="privacy" />,
});
