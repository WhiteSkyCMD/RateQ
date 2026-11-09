// SMS via Twilio. On Vercel (no LOVABLE_API_KEY) we call api.twilio.com directly with
// TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN; inside Lovable we use the connector gateway.
const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

type Target = { base: string; headers: Record<string, string> };

function target(): Target {
  const sid = process.env["TWILIO_ACCOUNT_SID"];
  const token = process.env["TWILIO_AUTH_TOKEN"];
  if (sid && token) {
    return {
      base: `https://api.twilio.com/2010-04-01/Accounts/${sid}`,
      headers: { Authorization: `Basic ${btoa(`${sid}:${token}`)}` },
    };
  }
  const lovable = process.env["LOVABLE_API_KEY"];
  const twilio = process.env["TWILIO_API_KEY"];
  if (lovable && twilio) return { base: GATEWAY_URL, headers: { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": twilio } };
  throw new Error("SMS_NOT_CONFIGURED");
}

let cachedFrom: string | null = null;
async function fromNumber(t: Target) {
  const configured = process.env["TWILIO_FROM_NUMBER"];
  if (configured) return configured;
  if (cachedFrom) return cachedFrom;
  const res = await fetch(`${t.base}/IncomingPhoneNumbers.json?PageSize=1`, { headers: t.headers });
  if (!res.ok) throw new Error(`Twilio [${res.status}]: ${await res.text()}`);
  const json = (await res.json()) as { incoming_phone_numbers?: { phone_number: string }[] };
  const n = json.incoming_phone_numbers?.[0]?.phone_number;
  if (!n) throw new Error("NO_TWILIO_NUMBER");
  cachedFrom = n;
  return n;
}

export function renderSms(template: string, vars: { naam: string; bedrijf: string; link: string }) {
  let body = template.replace(/\{naam\}/g, vars.naam).replace(/\{bedrijf\}/g, vars.bedrijf);
  body = body.includes("{link}") ? body.replace(/\{link\}/g, vars.link) : `${body} ${vars.link}`;
  return body;
}

export async function sendSms(to: string, body: string): Promise<string> {
  const t = target();
  const From = await fromNumber(t);
  const res = await fetch(`${t.base}/Messages.json`, {
    method: "POST",
    headers: { ...t.headers, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: to, From, Body: body }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Twilio send failed [${res.status}]: ${text}`);
    let msg = text;
    try { msg = (JSON.parse(text) as { message?: string }).message ?? text; } catch { /* keep raw */ }
    throw new Error(msg);
  }
  return ((await res.json()) as { sid: string }).sid;
}
