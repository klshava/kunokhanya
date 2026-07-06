import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

/**
 * Webhook endpoint for WordPress to POST new form submissions into.
 *
 * Configure your WordPress form plugin (e.g. WPForms, Gravity Forms, Contact
 * Form 7 + a webhook add-on, or a small custom snippet) to send a POST
 * request here with a JSON body, including the shared secret below.
 *
 * Required header:  x-webhook-secret: <LEADS_WEBHOOK_SECRET from your .env>
 * Body (JSON):
 *   {
 *     "full_name": "Jane Doe",
 *     "email": "jane@example.com",
 *     "contact_number": "0821234567",
 *     "course_interested": "Home-Based Care (HBC)"
 *   }
 */
const leadPayloadSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  contact_number: z.string().optional(),
  course_interested: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret");

  if (!secret || secret !== process.env.LEADS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = leadPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("website_leads").insert({
    full_name: parsed.data.full_name,
    email: parsed.data.email || null,
    contact_number: parsed.data.contact_number || null,
    course_interested: parsed.data.course_interested || null,
    source: "wordpress_form",
    status: "new",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
