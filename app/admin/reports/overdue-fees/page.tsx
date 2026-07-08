import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatZAR, formatDate } from "@/lib/currency";
import type { StudentStatus } from "@/lib/database.types";

type CourseInfo = { course_name: string; duration_months: number | null; monthly_fee: number; registration_fee: number };

type StudentRow = {
  student_id: string;
  student_number: string | null;
  full_name: string;
  contact_number: string | null;
  email: string | null;
  enrollment_date: string;
  status: StudentStatus;
  registration_fee_override: number | null;
  courses: CourseInfo | CourseInfo[] | null;
};

type BalanceRow = { student_id: string; total_paid: number; balance: number };

function courseOf(row: StudentRow): CourseInfo | null {
  const c = row.courses;
  if (!c) return null;
  return Array.isArray(c) ? c[0] ?? null : c;
}

// Full calendar months completed since enrollment (e.g. enrolled Jan 15, today
// Mar 8 -> 1, since the Mar "monthiversary" on the 15th hasn't happened yet).
function monthsElapsed(enrollmentDate: string, today: Date): number {
  const enrolled = new Date(enrollmentDate);
  let months = (today.getFullYear() - enrolled.getFullYear()) * 12 + (today.getMonth() - enrolled.getMonth());
  if (today.getDate() < enrolled.getDate()) months -= 1;
  return Math.max(0, months);
}

// Supabase's `.in()` filter is sent as a GET query string -- chunk it so a
// large id list (e.g. "Any status" selected) can't blow past URL length limits.
async function fetchBalancesInChunks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[]
): Promise<BalanceRow[]> {
  const rows: BalanceRow[] = [];
  const chunkSize = 200;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { data } = await supabase
      .from("student_balances")
      .select("student_id, total_paid, balance")
      .in("student_id", chunk);
    rows.push(...((data as BalanceRow[] | null) ?? []));
  }
  return rows;
}

export default async function OverdueFeesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const role = await getCurrentRole();
  if (role !== "admin" && role !== "registrar") redirect("/admin");

  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "active";
  const sort = typeof params.sort === "string" ? params.sort : "balance";

  const supabase = await createClient();

  let query = supabase
    .from("students")
    .select(
      "student_id, student_number, full_name, contact_number, email, enrollment_date, status, registration_fee_override, courses(course_name, duration_months, monthly_fee, registration_fee)"
    )
    .order("student_id");
  if (status) query = query.eq("status", status as StudentStatus);

  const students: StudentRow[] = [];
  let offset = 0;
  while (true) {
    const { data } = await query.range(offset, offset + 999);
    const batch = (data as unknown as StudentRow[] | null) ?? [];
    students.push(...batch);
    if (batch.length < 1000) break;
    offset += 1000;
  }

  const balances = await fetchBalancesInChunks(supabase, students.map((s) => s.student_id));
  const balanceByStudent = new Map(balances.map((b) => [b.student_id, { totalPaid: Number(b.total_paid), balance: Number(b.balance) }]));

  // Tab 1: total outstanding balance, regardless of how it accrued.
  const overdue = students
    .map((s) => ({ ...s, balance: balanceByStudent.get(s.student_id)?.balance ?? 0 }))
    .filter((s) => s.balance > 0);

  overdue.sort((a, b) =>
    sort === "oldest" ? a.enrollment_date.localeCompare(b.enrollment_date) : b.balance - a.balance
  );

  const totalOutstanding = overdue.reduce((sum, s) => sum + s.balance, 0);

  // Tab 2: behind on the monthly payment schedule specifically -- expected
  // cumulative payment by now (registration fee + monthly fee x months
  // elapsed, capped at course length) vs what they've actually paid in
  // total. Comparing cumulative totals (rather than month-by-month) means a
  // student who pays several months at once is correctly not flagged.
  const today = new Date();
  const arrears = students
    .map((s) => {
      const course = courseOf(s);
      if (!course || course.duration_months == null) return null;
      const elapsed = monthsElapsed(s.enrollment_date, today);
      const monthsDue = Math.min(course.duration_months, elapsed + 1);
      const regFee = s.registration_fee_override ?? course.registration_fee ?? 0;
      const expectedPaid = regFee + course.monthly_fee * monthsDue;
      const totalPaid = balanceByStudent.get(s.student_id)?.totalPaid ?? 0;
      const owing = expectedPaid - totalPaid;
      const monthsBehind = course.monthly_fee > 0 ? Math.floor(owing / course.monthly_fee) : 0;
      return { ...s, course, expectedPaid, totalPaid, owing, monthsBehind };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null && s.owing > 0);

  arrears.sort((a, b) => (sort === "oldest" ? a.enrollment_date.localeCompare(b.enrollment_date) : b.owing - a.owing));

  const totalArrears = arrears.reduce((sum, s) => sum + s.owing, 0);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Overdue Fees" backHref="/admin/reports" backLabel="Reports" />

      <Card className="mb-6 p-4 sm:p-5">
        <form
          method="get"
          key={`${status}-${sort}`}
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap"
        >
          <select
            name="status"
            defaultValue={status}
            className="h-10 rounded-xl border border-border bg-surface px-3 text-sm text-ink"
          >
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="withdrawn">Withdrawn</option>
          </select>

          <select
            name="sort"
            defaultValue={sort}
            className="h-10 rounded-xl border border-border bg-surface px-3 text-sm text-ink"
          >
            <option value="balance">Largest amount first</option>
            <option value="oldest">Oldest enrollment first</option>
          </select>

          <Button type="submit" variant="outline">
            Apply filters
          </Button>
        </form>
      </Card>

      <Tabs defaultValue="balance">
        <TabsList>
          <TabsTrigger value="balance">Total Balance</TabsTrigger>
          <TabsTrigger value="arrears">Behind This Month</TabsTrigger>
        </TabsList>

        <TabsContent value="balance">
          <p className="mb-3 text-sm text-ink-soft">
            {overdue.length} student{overdue.length === 1 ? "" : "s"} with an outstanding balance -- {formatZAR(totalOutstanding)} total
          </p>
          <Card>
            {overdue.length === 0 ? (
              <p className="p-6 text-sm text-ink-soft">No outstanding balances for this filter.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border-soft text-xs uppercase tracking-wide text-ink-faint">
                      <th className="px-5 py-3">Student</th>
                      <th className="px-5 py-3">Course</th>
                      <th className="px-5 py-3">Enrolled</th>
                      <th className="px-5 py-3">Contact</th>
                      <th className="px-5 py-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdue.map((s) => (
                      <tr key={s.student_id} className="border-b border-border-soft last:border-0">
                        <td className="px-5 py-3">
                          <Link href={`/admin/students/${s.student_id}`} className="font-medium text-ink hover:underline">
                            {s.full_name}
                          </Link>
                          <p className="text-xs text-ink-faint">{s.student_number}</p>
                        </td>
                        <td className="px-5 py-3 text-ink-soft">{courseOf(s)?.course_name ?? "-"}</td>
                        <td className="px-5 py-3 text-ink-soft">{formatDate(s.enrollment_date)}</td>
                        <td className="px-5 py-3 text-ink-soft">{s.contact_number ?? s.email ?? "-"}</td>
                        <td className="px-5 py-3 text-right font-semibold text-ink">{formatZAR(s.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="arrears">
          <p className="mb-3 text-sm text-ink-soft">
            {arrears.length} student{arrears.length === 1 ? "" : "s"} behind on their monthly payment schedule --{" "}
            {formatZAR(totalArrears)} total owing. Based on registration fee + monthly fee x months elapsed since
            enrollment, compared to total paid to date.
          </p>
          <Card>
            {arrears.length === 0 ? (
              <p className="p-6 text-sm text-ink-soft">Everyone in this filter is up to date on their monthly payments.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border-soft text-xs uppercase tracking-wide text-ink-faint">
                      <th className="px-5 py-3">Student</th>
                      <th className="px-5 py-3">Course</th>
                      <th className="px-5 py-3">Enrolled</th>
                      <th className="px-5 py-3 text-right">Should have paid</th>
                      <th className="px-5 py-3 text-right">Paid</th>
                      <th className="px-5 py-3 text-right">Owing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arrears.map((s) => (
                      <tr key={s.student_id} className="border-b border-border-soft last:border-0">
                        <td className="px-5 py-3">
                          <Link href={`/admin/students/${s.student_id}`} className="font-medium text-ink hover:underline">
                            {s.full_name}
                          </Link>
                          <p className="text-xs text-ink-faint">{s.student_number}</p>
                        </td>
                        <td className="px-5 py-3 text-ink-soft">{s.course.course_name}</td>
                        <td className="px-5 py-3 text-ink-soft">{formatDate(s.enrollment_date)}</td>
                        <td className="px-5 py-3 text-right text-ink-soft">{formatZAR(s.expectedPaid)}</td>
                        <td className="px-5 py-3 text-right text-ink-soft">{formatZAR(s.totalPaid)}</td>
                        <td className="px-5 py-3 text-right font-semibold text-ink">{formatZAR(s.owing)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
