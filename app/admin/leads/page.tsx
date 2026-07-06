import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/currency";
import { ConvertLeadDialog } from "./convert-lead-dialog";
import { LeadStatusSelect } from "./lead-status-select";

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("website_leads")
    .select("*")
    .order("submitted_at", { ascending: false });

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .eq("is_active", true)
    .order("course_name");

  return (
    <div>
      <PageHeader
        title="Website leads"
        description="Enquiries submitted through your WordPress site, ready to review and convert."
        backHref="/admin"
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-soft text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Course interested</th>
                <th className="px-5 py-3 font-medium">Submitted</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {leads?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-ink-soft">
                    No leads yet. New WordPress form submissions will appear here automatically.
                  </td>
                </tr>
              )}
              {leads?.map((lead) => (
                <tr key={lead.lead_id} className="border-b border-border-soft last:border-0">
                  <td className="px-5 py-3 font-medium text-ink">{lead.full_name}</td>
                  <td className="px-5 py-3 text-ink-soft">
                    <div>{lead.email ?? "-"}</div>
                    <div className="text-xs text-ink-faint">{lead.contact_number ?? ""}</div>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{lead.course_interested ?? "-"}</td>
                  <td className="px-5 py-3 text-ink-soft">{formatDate(lead.submitted_at)}</td>
                  <td className="px-5 py-3">
                    <LeadStatusSelect leadId={lead.lead_id} status={lead.status} />
                  </td>
                  <td className="px-5 py-3">
                    {lead.status !== "converted" && (
                      <ConvertLeadDialog lead={lead} courses={courses ?? []} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
