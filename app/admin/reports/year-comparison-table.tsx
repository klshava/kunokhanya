import { formatZAR } from "@/lib/currency";

export type YearRow = {
  year: string;
  totalEnrollments: number;
  active: number;
  completed: number;
  withdrawn: number;
  completionRate: number;
  withdrawalRate: number;
  revenueCollected: number;
  revenueOutstanding: number;
};

export function YearComparisonTable({ rows }: { rows: YearRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink-soft">No enrollment data matches the current filters.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border-soft text-xs uppercase tracking-wide text-ink-faint">
            <th className="px-5 py-3 font-medium">Year</th>
            <th className="px-5 py-3 font-medium">Enrollments</th>
            <th className="px-5 py-3 font-medium">Active</th>
            <th className="px-5 py-3 font-medium">Completed</th>
            <th className="px-5 py-3 font-medium">Withdrawn</th>
            <th className="px-5 py-3 font-medium">Completion %</th>
            <th className="px-5 py-3 font-medium">Withdrawal %</th>
            <th className="px-5 py-3 font-medium">Revenue collected</th>
            <th className="px-5 py-3 font-medium">Revenue outstanding</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.year} className="border-b border-border-soft last:border-0">
              <td className="px-5 py-3 font-medium text-ink">{r.year}</td>
              <td className="px-5 py-3 text-ink-soft">{r.totalEnrollments}</td>
              <td className="px-5 py-3 text-ink-soft">{r.active}</td>
              <td className="px-5 py-3 text-ink-soft">{r.completed}</td>
              <td className="px-5 py-3 text-ink-soft">{r.withdrawn}</td>
              <td className="px-5 py-3 text-ink-soft">{r.completionRate.toFixed(0)}%</td>
              <td className="px-5 py-3 text-ink-soft">{r.withdrawalRate.toFixed(0)}%</td>
              <td className="px-5 py-3 text-ink-soft">{formatZAR(r.revenueCollected)}</td>
              <td className="px-5 py-3 text-ink-soft">{formatZAR(r.revenueOutstanding)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
