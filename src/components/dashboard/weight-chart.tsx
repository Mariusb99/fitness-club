"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyWeightPoint } from "@/lib/data/dashboard";

export function WeightChart({ data }: { data: MonthlyWeightPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-text-faint">
        Fără date suficiente încă.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <XAxis
          dataKey="label"
          stroke="var(--text-faint)"
          tickLine={false}
          axisLine={false}
          fontSize={12}
        />
        <YAxis stroke="var(--text-faint)" tickLine={false} axisLine={false} fontSize={12} />
        <Tooltip
          contentStyle={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--text)",
          }}
          labelStyle={{ color: "var(--text-muted)" }}
        />
        <Line
          type="monotone"
          dataKey="avgWeight"
          name="Greutate medie (kg)"
          stroke="var(--accent)"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "var(--accent)", strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
