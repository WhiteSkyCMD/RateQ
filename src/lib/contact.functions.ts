import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().min(5).max(2000),
  website: z.string().max(0).optional(), // honeypot
});

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((d) => contactSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_submissions").insert({
      name: data.name,
      company: data.company || null,
      email: data.email,
      phone: data.phone || null,
      message: data.message,
    });
    if (error) throw new Error("Could not save message");
    return { ok: true };
  });
