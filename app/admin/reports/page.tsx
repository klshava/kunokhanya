import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatZAR } from "@/lib/currency";
import { CourseBarChart } from "./course-chart";
import { EnrollmentTrendChart } from "./enrollment-trend-chart";
import { FeesBreakdownChart } from "./fees-breakdown-chart";
import { YearComparisonTable, type YearRow } from "./year-comparison-table";
import { YearComparisonChart } from "./year-comparison-chart";
import { Users, TrendingUp, TrendingDown, GraduationCap } from "lucide-react";
import type { StudentStatus } from "@/lib/database.types";

const INTAKE_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const PAGE_SIZE = 1000;

// Supabase's PostgREST enforces a hard server-side max-rows cap (currently
// 1,000) regardless of what range the client requests, so any table that can
// exceed that needs real pagination rather than a single `.range()` call.
async function fetchAllPages<T>(
  queryFn: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const rows: T[] = [];
  let offset = 0;
  while (true) {
    const { data } = await queryFn(offset, offset + PAGE_SIZE - 1);
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return rows;
}

type StudentRow = {
  student_id: string;
  course_id: string | null;
  status: string;
  enrollment_date: string;
};

type BalanceRow = { student_id: string; total_paid: number; balance: number };
type PaymentRow = { student_id: string; amount: number; notes: string | null };

function categorizePayment(notes: string | null): "registration" | "moderator" | "monthly" | "other" {
  if (!notes) return "other";
  if (notes === "Registration Fee") return "registration";
  if (notes === "Moderator Fee") return "moderator";
  if (/^Month \d+$/.test(notes)) return "monthly";
  return "other";
}

function buildFeesBreakdown(payments: PaymentRow[]) {
  const totals = { registration: 0, moderator: 0, monthly: 0, other: 0 };
  for (const p of payments) {
    totals[categorizePayment(p.notes)] += Number(p.amount);
  }
  return [
    { category: "Registration Fee", amount: totals.registration },
    { category: "Moderator Fee", amount: totals.moderator },
    { category: "Monthly Installments", amount: totals.monthly },
    ...(totals.other > 0 ? [{ category: "Other", amount: totals.other }] : []),
  ];
}

function buildEnrollmentTrend(students: StudentRow[]) {
  const trendMap = new Map<string, number>();
  for (const s of students) {
    const bucket = s.enrollment_date.slice(0, 7);
    trendMap.set(bucket, (trendMap.get(bucket) ?? 0) + 1);
  }
  return Array.from(trendMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

function buildYearComparison(students: StudentRow[], balances: BalanceRow[]): YearRow[] {
  const byYear = new Map<string, YearRow>();
  const yearByStudentId = new Map<string, string>();

  for (const s of students) {
    const year = s.enrollment_date.slice(0, 4);
    yearByStudentId.set(s.student_id, year);
    if (!byYear.has(year)) {
      byYear.set(year, {
        year, totalEnrollments: 0, active: 0, completed: 0, withdrawn: 0,
        completionRate: 0, withdrawalRate: 0, revenueCollected: 0, revenueOutstanding: 0,
      });
    }
    const row = byYear.get(year)!;
    row.totalEnrollments += 1;
    if (s.status === "active") row.active += 1;
    if (s.status === "completed") row.completed += 1;
    if (s.status === "withdrawn") row.withdrawn += 1;
  }

  for (const b of balances) {
    const year = yearByStudentId.get(b.student_id);
    if (!year) continue;
    const row = byYear.get(year)!;
    row.revenueCollected += Number(b.total_paid);
    row.revenueOutstanding += Math.max(0, Number(b.balance));
  }

  for (const row of byYear.values()) {
    row.completionRate = row.totalEnrollments ? (row.completed / row.totalEnrollments) * 100 : 0;
    row.withdrawalRate = row.totalEnrollments ? (row.withdrawn / row.totalEnrollments) * 100 : 0;
  }

  return Array.from(byYear.values()).sort((a, b) => b.year.localeCompare(a.year));
}

function buildOutstandingByCourse(balances: BalanceRow[], courseNameById: Map<string, string>, courseIdByStudent: Map<string, string | null>) {
  const byCourse = new Map<string, { name: string; countOwing: number; totalOutstanding: number }>();
  for (const b of balances) {
    const courseId = courseIdByStudent.get(b.student_id) ?? null;
    const key = courseId ?? "unassigned";
    const name = courseId ? courseNameById.get(courseId) ?? "Unassigned" : "Unassigned";
    if (!byCourse.has(key)) byCourse.set(key, { name, countOwing: 0, totalOutstanding: 0 });
    const row = byCourse.get(key)!;
    const owed = Math.max(0, Number(b.balance));
    if (owed > 0) row.countOwing += 1;
    row.totalOutstanding += owed;
  }
  return Array.from(byCourse.values()).sort((a, b) => b.totalOutstanding - a.totalOutstanding);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const role = await getCurrentRole();
  if (role !== "admin") redirect("/admin");

  const params = await searchParams;
  const courseId = typeof params.course === "string" ? params.course : "";
  const intake = typeof params.intake === "string" ? params.intake : "";
  const year = typeof params.year === "string" ? params.year : "";
  const status = typeof params.status === "string" ? params.status : "";

  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("course_id, course_name")
    .order("course_name");
  const courseNameById = new Map((courses ?? []).map((c) => [c.course_id, c.course_name]));

  // Data volume is modest (~1,400 students, ~12,000 payments) so we fetch each
  // table in full and filter/join in plain TS below, rather than pushing large
  // `.in(id, [...])` lists into the URL (which silently fails past a few
  // hundred ids — the request URL exceeds the server's length limit).
  function buildStudentsQuery(from: number, to: number) {
    let q = supabase
      .from("students")
      .select("student_id, course_id, status, enrollment_date")
      .order("student_id")
      .range(from, to);
    if (courseId) q = q.eq("course_id", courseId);
    if (intake) q = q.eq("intake_month", intake);
    if (status) q = q.eq("status", status as StudentStatus);
    if (year) q = q.gte("enrollment_date", `${year}-01-01`).lte("enrollment_date", `${year}-12-31`);
    return q;
  }

  function buildYearCompareQuery(from: number, to: number) {
    let q = supabase
      .from("students")
      .select("student_id, course_id, status, enrollment_date")
      .order("student_id")
      .range(from, to);
    if (courseId) q = q.eq("course_id", courseId);
    if (intake) q = q.eq("intake_month", intake);
    if (status) q = q.eq("status", status as StudentStatus);
    return q;
  }

  const [students, yearCompareStudents, allBalances, allPayments] = await Promise.all([
    fetchAllPages(buildStudentsQuery),
    fetchAllPages(buildYearCompareQuery),
    fetchAllPages((from, to) =>
      supabase.from("student_balances").select("*").order("student_id").range(from, to)
    ),
    fetchAllPages((from, to) =>
      supabase.from("payments").select("student_id, amount, notes").order("student_id").range(from, to)
    ),
  ]);

  const filteredIds = new Set(students.map((s) => s.student_id));
  const yearCompareIds = new Set(yearCompareStudents.map((s) => s.student_id));

  const balances = allBalances.filter((b) => filteredIds.has(b.student_id));
  const payments = allPayments.filter((p) => filteredIds.has(p.student_id));
  const yearCompareBalances = allBalances.filter((b) => yearCompareIds.has(b.student_id));

  const availableYears = Array.from(
    new Set(yearCompareStudents.map((s) => s.enrollment_date.slice(0, 4)))
  ).sort((a, b) => b.localeCompare(a));

  const studentRows = students as StudentRow[];
  const balanceRows = balances as BalanceRow[];
  const paymentRows = payments as PaymentRow[];

  const totalEnrollments = studentRows.length;
  const activeCount = studentRows.filter((s) => s.status === "active").length;
  const totalRevenue = balanceRows.reduce((sum, b) => sum + Number(b.total_paid), 0);
  const totalOutstanding = balanceRows.reduce((sum, b) => sum + Math.max(0, Number(b.balance)), 0);

  const countsByCourse = new Map<string, number>();
  studentRows.forEach((s) => {
    const name = s.course_id ? courseNameById.get(s.course_id) ?? "Unassigned" : "Unassigned";
    countsByCourse.set(name, (countsByCourse.get(name) ?? 0) + 1);
  });
  const courseChartData = Array.from(countsByCourse.entries()).map(([name, count]) => ({ name, count }));

  const enrollmentTrendData = buildEnrollmentTrend(studentRows);
  const feesBreakdownData = buildFeesBreakdown(paymentRows);

  const courseIdByStudent = new Map(studentRows.map((s) => [s.student_id, s.course_id]));
  const outstandingByCourse = buildOutstandingByCourse(balanceRows, courseNameById, courseIdByStudent);

  const yearRows = buildYearComparison(yearCompareStudents as StudentRow[], yearCompareBalances as BalanceRow[]);
  const yearChartData = yearRows
    .slice()
    .sort((a, b) => a.year.localeCompare(b.year))
    .map((r) => ({ year: r.year, collected: r.revenueCollected, outstanding: r.revenueOutstanding }));

  return (
    <div>
      <PageHeader title="Reports" description="Enrollment, fees, and year-over-year performance." backHref="/admin" />

      <Card className="mb-6 p-4 sm:p-5">
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <select
            name="course"
            defaultValue={courseId}
            className="h-10 rounded-xl border border-border bg-surface px-3 text-sm text-ink"
          >
            <option value="">All courses</option>
            {courses?.map((c) => (
              <option key={c.course_id} value={c.course_id}>
                {c.course_name}
              </option>
            ))}
          </select>

          <select
            name="intake"
            defaultValue={intake}
            className="h-10 rounded-xl border border-border bg-surface px-3 text-sm text-ink"
          >
            <option value="">Any intake</option>
            {INTAKE_MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            name="year"
            defaultValue={year}
            className="h-10 rounded-xl border border-border bg-surface px-3 text-sm text-ink"
          >
            <option value="">Any year</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

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

          <Button type="submit" variant="outline">
            Apply filters
          </Button>
        </form>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={GraduationCap} label="Total enrollments" value={String(totalEnrollments)} tone="brand" />
        <SummaryCard icon={Users} label="Active students" value={String(activeCount)} tone="brand" />
        <SummaryCard icon={TrendingUp} label="Revenue collected" value={formatZAR(totalRevenue)} tone="success" />
        <SummaryCard icon={TrendingDown} label="Revenue outstanding" value={formatZAR(totalOutstanding)} tone="warning" />
      </div>

      <Tabs defaultValue="enrollment">
        <TabsList>
          <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          <TabsTrigger value="outstanding">Outstanding Fees</TabsTrigger>
          <TabsTrigger value="fees">Fees Breakdown</TabsTrigger>
          <TabsTrigger value="years">Year Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="enrollment">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 text-[15px] font-semibold text-ink">Students per course</h3>
                {courseChartData.length === 0 ? (
                  <p className="text-sm text-ink-soft">No students match the current filters.</p>
                ) : (
                  <CourseBarChart data={courseChartData} />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 text-[15px] font-semibold text-ink">Enrollments per month</h3>
                {enrollmentTrendData.length === 0 ? (
                  <p className="text-sm text-ink-soft">No students match the current filters.</p>
                ) : (
                  <EnrollmentTrendChart data={enrollmentTrendData} />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="outstanding">
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-[15px] font-semibold text-ink">Outstanding balance by course</h3>
              {outstandingByCourse.length === 0 ? (
                <p className="text-sm text-ink-soft">No outstanding balances for the current filters.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border-soft text-xs uppercase tracking-wide text-ink-faint">
                        <th className="px-5 py-3 font-medium">Course</th>
                        <th className="px-5 py-3 font-medium">Students owing</th>
                        <th className="px-5 py-3 font-medium">Total outstanding</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outstandingByCourse.map((row) => (
                        <tr key={row.name} className="border-b border-border-soft last:border-0">
                          <td className="px-5 py-3 text-ink">{row.name}</td>
                          <td className="px-5 py-3 text-ink-soft">{row.countOwing}</td>
                          <td className="px-5 py-3 text-ink-soft">{formatZAR(row.totalOutstanding)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-[15px] font-semibold text-ink">Revenue by fee category</h3>
              {paymentRows.length === 0 ? (
                <p className="text-sm text-ink-soft">No payments recorded for the current filters.</p>
              ) : (
                <FeesBreakdownChart data={feesBreakdownData} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="years">
          <div className="flex flex-col gap-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 text-[15px] font-semibold text-ink">Revenue collected vs. outstanding by year</h3>
                {yearChartData.length === 0 ? (
                  <p className="text-sm text-ink-soft">No enrollment data available.</p>
                ) : (
                  <YearComparisonChart data={yearChartData} />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 text-[15px] font-semibold text-ink">Year-over-year performance</h3>
                <p className="mb-4 text-xs text-ink-faint">
                  Always shows every year, regardless of the year filter above (course/intake/status filters still apply).
                </p>
                <YearComparisonTable rows={yearRows} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tone: "brand" | "success" | "warning";
}) {
  const toneClasses = {
    brand: "bg-brand-50 text-brand-700",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
  } as const;

  return (
    <Card className="p-5">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">{value}</p>
    </Card>
  );
}
