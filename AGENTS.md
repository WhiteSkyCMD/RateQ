<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- UI copy lives in `src/lib/i18n.tsx` (nl default, en optional); never hardcode user-facing strings. Why: whole app is bilingual.
- Review routing rules live in `src/lib/routing.ts` and are covered by `src/test/routing.test.ts`. Why: single source for star-threshold logic.
- Public review pages (`/r/$token`) read/write via server functions with the admin client, keyed by the unguessable token. Why: customers have no account.
- Billing columns on `businesses` (plan, sms_credits) are protected by a trigger; only server code changes them. Why: prevent client-side credit edits.
- Email goes through Resend (gateway) in `src/lib/email.server.ts`, sent from noreply@rateq.nl; weekly reminders run via the managed schedule calling `/api/public/jobs/send-reminders`. Why: one portable mail path.

## Project rules (legal & jobs)
- Long legal texts (privacy, terms, DPA) and company details live in `src/lib/legal.ts` (nl+en), not in i18n.tsx. Why: keeps the UI dictionary lean.
- Customer reminders (one per request, after REMINDER_AFTER_MS, same channel) run hourly via the managed schedule calling `/api/public/jobs/send-customer-reminders`. Why: `reminded_at` is claimed first so nobody is reminded twice.
- Twilio/Resend helpers use the Lovable gateway only when LOVABLE_API_KEY is set, otherwise the provider APIs directly; cron jobs accept CRON_SECRET (Vercel, see vercel.json) or LOVABLE_CRON_SECRET. Why: the app must run standalone on Vercel.
