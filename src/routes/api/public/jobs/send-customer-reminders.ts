import { createFileRoute } from "@tanstack/react-router";
import { authorizeCron } from "@/lib/cron-auth.server";
import { REMINDER_AFTER_MS, REMINDER_SMS_TEMPLATE, renderSms } from "@/lib/routing";

const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const Route = createFileRoute("/api/public/jobs/send-customer-reminders")({
  server: {
    handlers: {
      GET: ({ request }) => run(request),
      POST: ({ request }) => run(request),
    },
  },
});

async function run(request: Request): Promise<Response> {
        const authFailure = await authorizeCron(request);
        if (authFailure) return authFailure;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { sendEmail, reviewReminderEmail } = await import("@/lib/email.server");
        const { sendSms } = await import("@/lib/sms.server");
        const origin = process.env["PUBLIC_APP_URL"] ?? new URL(request.url).origin;
        const now = Date.now();

        const { data: rows } = await supabaseAdmin
          .from("review_requests")
          .select("id, business_id, token, channel, customer_name, customer_phone, customer_email, businesses(name)")
          .eq("status", "sent")
          .is("rating", null)
          .is("reminded_at", null)
          .lte("created_at", new Date(now - REMINDER_AFTER_MS).toISOString())
          .gte("created_at", new Date(now - MAX_AGE).toISOString())
          .limit(200);

        let sent = 0;
        for (const r of rows ?? []) {
          // Claim first so a request is never reminded twice.
          await supabaseAdmin.from("review_requests").update({ reminded_at: new Date().toISOString() }).eq("id", r.id);
          const business = (r.businesses as { name: string } | null)?.name ?? "";
          const firstName = r.customer_name.split(" ")[0] ?? r.customer_name;
          const link = `${origin}/r/${r.token}`;
          if (r.channel !== "sms" && r.customer_email) {
            try {
              await sendEmail({ to: r.customer_email, fromName: business, ...reviewReminderEmail({ firstName, business, link }) });
              sent++;
            } catch (e) { console.error("Reminder email failed", r.id, e); }
          }
          if (r.channel !== "email" && r.customer_phone) {
            const { data: ok } = await supabaseAdmin.rpc("consume_sms_credit", { _business_id: r.business_id });
            if (!ok) continue;
            try {
              await sendSms(r.customer_phone, renderSms(REMINDER_SMS_TEMPLATE, { naam: firstName, bedrijf: business, link }));
              sent++;
            } catch (e) {
              await supabaseAdmin.rpc("refund_sms_credit", { _business_id: r.business_id });
              console.error("Reminder sms failed", r.id, e);
            }
          }
        }
        return Response.json({ success: true, checked: rows?.length ?? 0, sent });
}
