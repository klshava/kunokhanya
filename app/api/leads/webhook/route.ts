import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

/**
 * Webhook endpoint for WordPress to POST new form submissions into.
 *
 * Configure your WordPress form plugin (e.g. Forminator, WPForms, Gravity
 * Forms, or Contact Form 7 + a webhook add-on) to send a POST request here
 * with a JSON body, authenticated with the shared secret below.
 *
 * The secret can be sent either way -- use whichever your form plugin
 * supports (some webhook UIs only let you configure a plain URL, with no
 * custom headers):
 *   Header:      x-webhook-secret: <LEADS_WEBHOOK_SECRET from your .env>
 *   Query param: ?secret=<LEADS_WEBHOOK_SECRET from your .env>
 *
 * Body (JSON) -- plugins that let you name your own keys should use:
 *   {
 *     "full_name": "Jane Doe",
 *     "email": "jane@example.com",
 *     "contact_number": "0821234567",
 *     "course_interested": "Home-Based Care (HBC)"
 *   }
 *
 * Forminator has no field-renaming UI -- it always POSTs its own internal
 * field codes. FORMINATOR_FIELD_ALIASES below maps the codes used by the
 * "Application Form" at kunokhanyatrainingacademy.co.za/registration-form/
 * (confirmed via a real submission captured in webhook_debug_log). If that
 * form is ever rebuilt from scratch, Forminator may reassign these codes and
 * this mapping would need to be re-checked the same way.
 */
const leadPayloadSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  contact_number: z.string().optional(),
  course_interested: z.string().optional(),
});

const FORMINATOR_FIELD_ALIASES: Record<string, string> = {
  full_name: "name_1",
  email: "email_1",
  contact_number: "phone_1",
  course_interested: "select_1",
};

function normalizeLeadPayload(body: Record<string, unknown>) {
  const pick = (key: string) => {
    const direct = body[key];
    if (typeof direct === "string" && direct.trim()) return direct.trim();
    const alias = FORMINATOR_FIELD_ALIASES[key];
    const aliased = alias ? body[alias] : undefined;
    return typeof aliased === "string" ? aliased.trim() : undefined;
  };

  return {
    full_name: pick("full_name"),
    email: pick("email"),
    contact_number: pick("contact_number"),
    course_interested: pick("course_interested")?.toUpperCase(),
  };
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret") || request.nextUrl.searchParams.get("secret");

  if (!secret || secret !== process.env.LEADS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Some form plugins (e.g. Forminator) ping this URL with an empty body to
  // verify it's reachable before letting you save the integration. Treat an
  // unparsable or incomplete body as a harmless connectivity check rather
  // than an error, as long as the secret above already checked out.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const normalized = body && typeof body === "object" ? normalizeLeadPayload(body as Record<string, unknown>) : {};
  const parsed = leadPayloadSchema.safeParse(normalized);
  if (!parsed.success) {
    // Temporary: capture whatever shape a non-matching request actually sent,
    // so we can see the real field names some form plugins use instead of
    // guessing. See supabase/migrations/0006_webhook_debug_log.sql.
    if (body && typeof body === "object" && Object.keys(body).length > 0) {
      const admin = createAdminClient();
      // Temporary debug table, not in the hand-maintained Database types.
      await (admin.from("webhook_debug_log" as never) as any).insert({ payload: body });
    }
    return NextResponse.json({ success: true, skipped: "No usable lead data in this request" }, { status: 200 });
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
