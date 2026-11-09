// Minimal Stripe REST client (fetch-based, works on Workers, Vercel and Node).
type Params = Record<string, unknown>;

function encode(params: Params, prefix = "", out: string[] = []): string[] {
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") encode(v as Params, key, out);
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
  }
  return out;
}

export async function stripe<T = any>(path: string, params?: Params, method = "POST"): Promise<T> {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("STRIPE_SECRET_KEY ontbreekt");
  const body = params ? encode(params).join("&") : undefined;
  const res = await fetch(`https://api.stripe.com/v1/${path}${method === "GET" && body ? `?${body}` : ""}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: method === "GET" ? null : (body ?? null),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `Stripe ${res.status}`);
  return json as T;
}

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

/** Verifies a Stripe-Signature header (t=...,v1=...) and returns the parsed event. */
export async function verifyStripeEvent(payload: string, header: string | null, secret: string) {
  if (!header) throw new Error("missing signature");
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = parts["t"];
  const sigs = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || !sigs.length) throw new Error("bad signature");
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) throw new Error("signature too old");
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = hex(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(`${t}.${payload}`)));
  if (!sigs.includes(expected)) throw new Error("signature mismatch");
  return JSON.parse(payload);
}
