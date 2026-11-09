const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM_DOMAIN = "rateq.nl";

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// Resend: inside Lovable (LOVABLE_API_KEY set) via the connector gateway, elsewhere (Vercel)
// directly against api.resend.com with your own RESEND_API_KEY.
export async function sendEmail(opts: { to: string; subject: string; html: string; fromName?: string | undefined; replyTo?: string | undefined }) {
  const lovable = process.env["LOVABLE_API_KEY"];
  const resend = process.env["RESEND_API_KEY"];
  if (!resend) throw new Error("EMAIL_NOT_CONFIGURED");
  const url = lovable ? `${GATEWAY_URL}/emails` : "https://api.resend.com/emails";
  const auth: Record<string, string> = lovable
    ? { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": resend }
    : { Authorization: `Bearer ${resend}` };
  const name = (opts.fromName ?? "RateQ").replace(/[<>"]/g, "").slice(0, 60);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify({ from: `${name} <noreply@${FROM_DOMAIN}>`, to: [opts.to], subject: opts.subject, html: opts.html, ...(opts.replyTo ? { reply_to: opts.replyTo } : {}) }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Resend failed [${res.status}]: ${text}`);
    let msg = text;
    try { msg = (JSON.parse(text) as { message?: string }).message ?? text; } catch { /* raw */ }
    throw new Error(msg);
  }
  return ((await res.json()) as { id: string }).id;
}

function layout(inner: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f5f7;font-family:'Plus Jakarta Sans',Arial,sans-serif;color:#111827">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px" cellpadding="0" cellspacing="0"><tr><td>${inner}</td></tr></table>
<p style="font-size:12px;color:#9ca3af;margin-top:16px">Verzonden via RateQ · rateq.nl</p>
</td></tr></table></body></html>`;
}

function button(href: string, label: string) {
  return `<a href="${esc(href)}" style="display:inline-block;background:#10B981;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:10px">${esc(label)}</a>`;
}

export function reviewInviteEmail(v: { firstName: string; business: string; link: string }) {
  return {
    subject: `Hoe was je ervaring bij ${v.business}?`,
    html: layout(`<h1 style="font-size:22px;margin:0 0 12px">Hoi ${esc(v.firstName)},</h1>
<p style="font-size:15px;line-height:1.6">Bedankt voor je bezoek aan <strong>${esc(v.business)}</strong>. Wil je ons laten weten hoe je het hebt ervaren? Het kost maar een paar seconden.</p>
<p style="font-size:28px;color:#F59E0B;margin:16px 0">★★★★★</p>
<p style="margin:24px 0">${button(v.link, "Geef je beoordeling")}</p>
<p style="font-size:13px;color:#6b7280">Groet,<br>${esc(v.business)}</p>`),
  };
}

export function negativeFeedbackEmail(v: { business: string; customer: string; phone: string; email: string | null; rating: number; feedback: string | null; dashboardUrl: string }) {
  return {
    subject: `⚠️ ${v.rating}-sterren beoordeling van ${v.customer}`,
    html: layout(`<h1 style="font-size:20px;margin:0 0 12px">Nieuwe interne feedback</h1>
<p style="font-size:15px;line-height:1.6"><strong>${esc(v.customer)}</strong> gaf <strong>${esc(v.business)}</strong> een beoordeling van <span style="color:#F59E0B">${"★".repeat(v.rating)}${"☆".repeat(5 - v.rating)}</span>. Deze review is niet publiek geplaatst.</p>
${v.feedback ? `<blockquote style="margin:16px 0;padding:12px 16px;background:#f9fafb;border-left:4px solid #10B981;font-size:14px;line-height:1.6">${esc(v.feedback)}</blockquote>` : ""}
<p style="font-size:14px;line-height:1.6">${v.phone ? `Telefoon: ${esc(v.phone)}<br>` : ""}${v.email ? `E-mail: ${esc(v.email)}` : ""}</p>
<p style="font-size:14px">Neem snel contact op om het recht te zetten.</p>
<p style="margin:24px 0">${button(v.dashboardUrl, "Bekijk in dashboard")}</p>`),
  };
}

export function reminderEmail(v: { name: string; business: string; dashboardUrl: string }) {
  return {
    subject: `Vergeet je reviews niet deze week, ${v.business}`,
    html: layout(`<h1 style="font-size:20px;margin:0 0 12px">Hoi ${esc(v.name)},</h1>
<p style="font-size:15px;line-height:1.6">Je hebt de afgelopen 7 dagen geen reviewverzoeken verstuurd voor <strong>${esc(v.business)}</strong>. Elke tevreden klant is een kans op een nieuwe 5-sterren review.</p>
<p style="font-size:15px;line-height:1.6">Stuur vandaag nog een paar verzoeken — het kost je minder dan 30 seconden.</p>
<p style="margin:24px 0">${button(v.dashboardUrl, "Verzoeken versturen")}</p>`),
  };
}

export function reviewReminderEmail(v: { firstName: string; business: string; link: string }) {
  return {
    subject: `Kleine herinnering: hoe was je ervaring bij ${v.business}?`,
    html: layout(`<h1 style="font-size:22px;margin:0 0 12px">Hoi ${esc(v.firstName)},</h1>
<p style="font-size:15px;line-height:1.6">Een paar dagen geleden vroegen we je naar je ervaring bij <strong>${esc(v.business)}</strong>. We horen het graag — het kost maar een paar seconden.</p>
<p style="margin:24px 0">${button(v.link, "Geef je beoordeling")}</p>
<p style="font-size:13px;color:#6b7280">Groet,<br>${esc(v.business)}</p>`),
  };
}
