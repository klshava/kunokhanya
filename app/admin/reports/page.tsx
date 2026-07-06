import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { formatZAR } from "@/lib/currency";
import { CourseBarChart } from "./course-chart";
import { Users, TrendingUp, TrendingDown } from "lucide-react";

export default async function ReportsPage() {
  const supabase = await createClient();

  const [{ count: totalActive }, { data: balances }, { data: courses }, { data: students }] =
    await Promise.all([
      supabase.from("students").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("student_balances").select("*"),
      supabase.from("courses").select("course_id, course_name"),
      supabase.from("students").select("course_id, status").eq("status", "active"),
    ]);

  const totalRevenue = (balances ?? []).reduce((sum, b) => sum + Number(b.total_paid), 0);
  const totalOutstanding = (balances ?? [])
    .filter((b) => b.status === "active")
    .reduce((sum, b) => sum + Math.max(0, Number(b.balance)), 0);

  const courseNameById = new Map((courses ?? []).map((c) => [c.course_id, c.course_name]));
  const countsByCourse = new Map<string, number>();
  (students ?? []).forEach((s) => {
    const name = s.course_id ? courseNameById.get(s.course_id) ?? "Unassigned" : "Unassigned";
    countsByCourse.set(name, (countsByCourse.get(name) ?? 0) + 1);
  });
  const chartData = Array.from(countsByCourse.entries()).map(([name, count]) => ({ name, count }));

  return (
    <div>
      <PageHeader title="Reports" description="A quick summary of enrollment and fees." backHref="/admin" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard icon={Users} label="Active students" value={String(totalActive ?? 0)} tone="brand" />
        <SummaryCard icon={TrendingUp} label="Revenue collected" value={formatZAR(totalRevenue)} tone="success" />
        <SummaryCard
          icon={TrendingDown}
          label="Revenue outstanding"
          value={formatZAR(totalOutstanding)}
          tone="warning"
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-[15px] font-semibold text-ink">Active students per course</h3>
          {chartData.length === 0 ? (
            <p className="text-sm text-ink-soft">No active students yet.</p>
          ) : (
            <CourseBarChart data={chartData} />
          )}
        </CardContent>
      </Card>
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
