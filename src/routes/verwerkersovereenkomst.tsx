import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/rateq/legal-page";

export const Route = createFileRoute("/verwerkersovereenkomst")({
  head: () => ({
    meta: [
      { title: "Verwerkersovereenkomst – RateQ" },
      { name: "description", content: "Verwerkersovereenkomst (art. 28 AVG) voor ondernemers die klantgegevens in RateQ verwerken." },
      { property: "og:title", content: "Verwerkersovereenkomst – RateQ" },
      { property: "og:description", content: "Verwerkersovereenkomst (art. 28 AVG) voor ondernemers die klantgegevens in RateQ verwerken." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <LegalPage doc="dpa" />,
});
