import { createFileRoute } from "@tanstack/react-router";
import { authorizeCron } from "@/lib/cron-auth.server";

const WEEK = 7 * 24 * 60 * 60 * 1000;

export const Route = createFileRoute("/api/public/jobs/send-reminders")({
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
        const { sendEmail, reminderEmail } = await import("@/lib/email.server");
        const since = new Date(Date.now() - WEEK).toISOString();
        const origin = process.env["PUBLIC_APP_URL"] ?? new URL(request.url).origin;

        const { data: businesses } = await supabaseAdmin
          .from("businesses")
          .select("id, name, owner_id, last_reminder_at, created_at");
        let sent = 0;
        for (const b of businesses ?? []) {
          if (b.last_reminder_at && b.last_reminder_at > since) continue;
          if (b.created_at > since) continue;
          const { count } = await supabaseAdmin
            .from("review_requests")
            .select("id", { count: "exact", head: true })
            .eq("business_id", b.id)
            .gte("created_at", since);
          if ((count ?? 0) > 0) continue;
          const { data: owner } = await supabaseAdmin.from("profiles").select("email, full_name").eq("id", b.owner_id).maybeSingle();
          if (!owner?.email) continue;
          try {
            await sendEmail({ to: owner.email, ...reminderEmail({ name: owner.full_name?.split(" ")[0] || b.name, business: b.name, dashboardUrl: `${origin}/klanten` }) });
            await supabaseAdmin.from("businesses").update({ last_reminder_at: new Date().toISOString() }).eq("id", b.id);
            sent++;
          } catch (e) {
            console.error("Reminder failed", b.id, e);
          }
        }
        return Response.json({ success: true, sent });
}
