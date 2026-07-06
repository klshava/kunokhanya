import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatZAR, formatDate } from "@/lib/currency";
import { Printer } from "lucide-react";

export default async function PortalFeesPage() {
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
        <PageHeader title="Fee statement" backHref="/portal" />
        <p className="text-sm text-ink-soft">
          Your account is not yet linked to a student record. Please contact the academy office.
        </p>
      </div>
    );
  }

  const studentId = profile.linked_student_id;

  const { data: student } = await supabase
    .from("students")
    .select("*, courses(*)")
    .eq("student_id", studentId)
    .single();

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("student_id", studentId)
    .order("payment_date", { ascending: false });

  const course = student?.courses as any;
  const totalFee = Number(course?.total_fee ?? 0);
  const totalPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = totalFee - totalPaid;

  return (
    <div>
      <PageHeader
        title="Fee statement"
        backHref="/portal"
        actions={
          <Link href={`/statement/${studentId}`} target="_blank">
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4" />
              Print / export PDF
            </Button>
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Registration fee" value={formatZAR(course?.registration_fee)} />
        <StatTile label="Monthly fee" value={formatZAR(course?.monthly_fee)} />
        <StatTile label="Total fee" value={formatZAR(totalFee)} />
        <StatTile label="Balance outstanding" value={formatZAR(balance)} tone={balance > 0 ? "danger" : "success"} />
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-[15px] font-semibold text-ink">Payment history</h3>
          {(payments ?? []).length === 0 ? (
            <p className="text-sm text-ink-soft">No payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border-soft text-xs uppercase tracking-wide text-ink-faint">
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 font-medium">Amount</th>
                    <th className="py-2 pr-4 font-medium">Method</th>
                    <th className="py-2 font-medium">Receipt no.</th>
                  </tr>
                </thead>
                <tbody>
                  {payments?.map((p) => (
                    <tr key={p.payment_id} className="border-b border-border-soft last:border-0">
                      <td className="py-2.5 pr-4 text-ink-soft">{formatDate(p.payment_date)}</td>
                      <td className="py-2.5 pr-4 font-medium text-ink">{formatZAR(p.amount)}</td>
                      <td className="py-2.5 pr-4 text-ink-soft">{p.payment_method ?? "-"}</td>
                      <td className="py-2.5 text-ink-soft">{p.receipt_number ?? "-"}</td>
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

function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "danger" | "success";
}) {
  return (
    <div className="rounded-2xl border border-border-soft bg-surface p-4 shadow-soft">
      <p className="text-xs text-ink-faint">{label}</p>
      <p
        className={
          "mt-1 text-lg font-semibold tracking-tight " +
          (tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : "text-ink")
        }
      >
        {value}
      </p>
    </div>
  );
}
