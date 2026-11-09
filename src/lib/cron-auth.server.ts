// Accepts both the Lovable managed schedule (LOVABLE_CRON_SECRET) and Vercel Cron (CRON_SECRET).
export async function authorizeCron(request: Request): Promise<Response | null> {
  const secrets = [process.env["CRON_SECRET"], process.env["LOVABLE_CRON_SECRET"], process.env["LOVABLE_CRON_SECRET_PREVIOUS"]].filter(Boolean) as string[];
  if (!secrets.length) return new Response("Server configuration error", { status: 500 });
  const token = /^Bearer ([^\s,]+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token) return new Response("Unauthorized", { status: 401 });
  const { createHash, timingSafeEqual } = await import("node:crypto");
  const d = (v: string) => createHash("sha256").update(v, "utf8").digest();
  const ok = secrets.some((s) => timingSafeEqual(d(token), d(s)));
  return ok ? null : new Response("Unauthorized", { status: 401 });
}
