"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { formatZAR } from "@/lib/currency";

export function FeesBreakdownChart({ data }: { data: { category: string; amount: number }[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E9" vertical={false} />
          <XAxis
            dataKey="category"
            tick={{ fontSize: 12, fill: "#6E6E73" }}
            axisLine={{ stroke: "#E5E5E9" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#6E6E73" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatZAR(v)}
            width={90}
          />
          <Tooltip
            formatter={(value: number) => formatZAR(value)}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #E5E5E9",
              boxShadow: "0 8px 24px -8px rgba(29,29,31,0.16)",
            }}
          />
          <Bar dataKey="amount" fill="#0F766E" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
