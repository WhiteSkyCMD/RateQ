import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LangToggle } from "@/components/rateq/brand";
import { getReview, submitRating } from "@/lib/reviews.functions";
import { PLATFORM_LABEL, type PlatformKey } from "@/lib/routing";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import icon from "@/assets/rateq-icon.png";

export const Route = createFileRoute("/r/$token")({
  loader: ({ params }) => (/^[a-f0-9]{32}$/.test(params.token) ? getReview({ data: { token: params.token } }) : null),
  head: () => ({
    meta: [
      { title: "Geef je beoordeling" },
      { name: "description", content: "Laat weten hoe je ervaring was." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Geef je beoordeling" },
      { property: "og:description", content: "Laat weten hoe je ervaring was." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const data = Route.useLoaderData();
  const { token } = Route.useParams();
  const { t } = useI18n();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [stage, setStage] = useState<"rate" | "public" | "low" | "lowdone">(data?.rated ? "lowdone" : "rate");
  const [platforms, setPlatforms] = useState<{ key: PlatformKey; url: string }[]>([]);
  const [feedback, setFeedback] = useState("");

  async function pick(n: number) {
    setRating(n);
    const r = await submitRating({ data: { token, rating: n } });
    if (r.public) { setPlatforms(r.platforms); setStage("public"); }
    else setStage("low");
  }
  async function sendFeedback() {
    await submitRating({ data: { token, rating, feedback } });
    setStage("lowdone");
  }

  return (
    <div className="bg-hero flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4"><LangToggle /></div>
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-glow">
        <img src={icon} alt="RateQ" className="mx-auto h-14 w-auto" />
        {!data ? (
          <p className="mt-6 text-muted-foreground">{t("rv_invalid")}</p>
        ) : stage === "rate" ? (
          <>
            <p className="mt-6 text-muted-foreground">{data.firstName}, {t("rv_title").toLowerCase()}</p>
            <h1 className="text-2xl font-bold">{data.business}?</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("rv_sub")}</p>
            <div className="mt-6 flex justify-center gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} aria-label={`${n}`} onMouseEnter={() => setHover(n)} onClick={() => pick(n)}
                  className={cn("text-5xl transition-transform hover:scale-110", n <= (hover || rating) ? "text-star" : "text-muted")}>★</button>
              ))}
            </div>
          </>
        ) : stage === "public" ? (
          <>
            <h1 className="mt-6 text-2xl font-bold">{t("rv_thanks")}</h1>
            <p className="mt-2 text-muted-foreground">{t("rv_redirect")}</p>
            <div className="mt-6 space-y-2">
              {platforms.map((p) => (
                <Button key={p.key} asChild className="w-full" size="lg">
                  <a href={p.url} target="_blank" rel="noopener noreferrer">{t("rv_go")} {PLATFORM_LABEL[p.key]} <ExternalLink /></a>
                </Button>
              ))}
            </div>
          </>
        ) : stage === "low" ? (
          <>
            <h1 className="mt-6 text-xl font-bold">{t("rv_low")}</h1>
            <Textarea className="mt-4" rows={5} placeholder={t("rv_low_ph")} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            <Button className="mt-4 w-full" onClick={sendFeedback} disabled={!feedback.trim()}>{t("rv_submit")}</Button>
          </>
        ) : (
          <p className="mt-6 text-muted-foreground">{data.rated && rating === 0 ? t("rv_done") : t("rv_low_thanks")}</p>
        )}
      </div>
    </div>
  );
}
