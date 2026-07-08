import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/currency";
import { FileText } from "lucide-react";

export default async function PortalResultsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("linked_student_id")
    .eq("id", user!.id)
    .single();

  if (!profile?.linked_student_id) {
    return (
      <div>
        <PageHeader title="Results" backHref="/portal" />
        <p className="text-sm text-ink-soft">
          Your account is not yet linked to a student record. Please contact the academy office.
        </p>
      </div>
    );
  }

  const studentId = profile.linked_student_id;

  const { data: results } = await supabase
    .from("results")
    .select("*")
    .eq("student_id", studentId)
    .order("assessed_date", { ascending: false });

  return (
    <div>
      <PageHeader title="Results" backHref="/portal" />

      <Card>
        <CardContent className="p-6">
          {(results ?? []).length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center">
              <FileText className="h-6 w-6 text-ink-faint" />
              <p className="text-sm text-ink-soft">No results recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border-soft text-xs uppercase tracking-wide text-ink-faint">
                    <th className="py-2 pr-4 font-medium">Module / unit standard</th>
                    <th className="py-2 pr-4 font-medium">Outcome</th>
                    <th className="py-2 font-medium">Date assessed</th>
                  </tr>
                </thead>
                <tbody>
                  {results?.map((r) => (
                    <tr key={r.result_id} className="border-b border-border-soft last:border-0">
                      <td className="py-2.5 pr-4 font-medium text-ink">{r.module_name}</td>
                      <td className="py-2.5 pr-4">
                        <Badge variant={r.outcome === "competent" ? "success" : "danger"}>
                          {r.outcome === "competent" ? "Competent" : "Not Yet Competent"}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-ink-soft">{formatDate(r.assessed_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
