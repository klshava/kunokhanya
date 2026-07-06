"use client";

import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatZAR, formatDate } from "@/lib/currency";
import { StudentForm } from "../student-form";
import { updateStudentAction } from "../actions";
import { AddPaymentDialog } from "./add-payment-dialog";
import { InviteButton } from "./invite-button";
import type { Course, Payment, Student } from "@/lib/database.types";
import { FileText, Printer } from "lucide-react";

export function DetailTabs({
  student,
  courses,
  payments,
  hasPortalAccount,
}: {
  student: Student & { courses: Course | null };
  courses: Course[];
  payments: Payment[];
  hasPortalAccount: boolean;
}) {
  const course = student.courses;
  const registrationFee = Number(student.registration_fee_override ?? course?.registration_fee ?? 0);
  const totalFee = Number(student.total_fee_override ?? course?.total_fee ?? 0);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = totalFee - totalPaid;

  const boundUpdate = updateStudentAction.bind(null, student.student_id);

  return (
    <Tabs defaultValue="fees">
      <div className="mb-6 flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="fees">Fee statement</TabsTrigger>
          <TabsTrigger value="details">Student details</TabsTrigger>
        </TabsList>
        {!hasPortalAccount && student.email && <InviteButton studentId={student.student_id} email={student.email} />}
        {hasPortalAccount && <Badge variant="success">Has portal account</Badge>}
      </div>

      <TabsContent value="fees">
        <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Registration fee" value={formatZAR(registrationFee)} />
          <StatTile label="Monthly fee" value={formatZAR(course?.monthly_fee)} />
          <StatTile label="Total fee" value={formatZAR(totalFee)} />
          <StatTile
            label="Balance outstanding"
            value={formatZAR(balance)}
            tone={balance > 0 ? "danger" : "success"}
          />
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-ink">Payment history</h3>
                <p className="text-sm text-ink-soft">
                  {formatZAR(totalPaid)} paid to date of {formatZAR(totalFee)}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/statement/${student.student_id}`} target="_blank">
                  <Button variant="outline" size="sm">
                    <Printer className="h-4 w-4" />
                    Print / export PDF
                  </Button>
                </Link>
                <AddPaymentDialog studentId={student.student_id} />
              </div>
            </div>

            {payments.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center">
                <FileText className="h-6 w-6 text-ink-faint" />
                <p className="text-sm text-ink-soft">No payments recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border-soft text-xs uppercase tracking-wide text-ink-faint">
                      <th className="py-2 pr-4 font-medium">Date</th>
                      <th className="py-2 pr-4 font-medium">Amount</th>
                      <th className="py-2 pr-4 font-medium">Method</th>
                      <th className="py-2 pr-4 font-medium">Receipt no.</th>
                      <th className="py-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.payment_id} className="border-b border-border-soft last:border-0">
                        <td className="py-2.5 pr-4 text-ink-soft">{formatDate(p.payment_date)}</td>
                        <td className="py-2.5 pr-4 font-medium text-ink">{formatZAR(p.amount)}</td>
                        <td className="py-2.5 pr-4 text-ink-soft">{p.payment_method ?? "-"}</td>
                        <td className="py-2.5 pr-4 text-ink-soft">{p.receipt_number ?? "-"}</td>
                        <td className="py-2.5 text-ink-soft">{p.notes ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="details">
        <Card>
          <CardContent className="p-6 sm:p-8">
            <StudentForm courses={courses} student={student} action={boundUpdate} submitLabel="Save changes" />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
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
