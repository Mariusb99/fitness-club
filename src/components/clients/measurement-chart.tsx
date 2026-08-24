"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Measurement } from "@/lib/types";

export function MeasurementChart({ measurements }: { measurements: Measurement[] }) {
  const data = [...measurements]
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
    .map((m) => ({
      label: new Date(m.recordedAt).toLocaleDateString("ro-RO", { month: "short", day: "2-digit" }),
      weight: m.weightKg,
    }));

  if (data.length < 2) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-text-faint">
        Ai nevoie de cel puțin două evaluări pentru grafic.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={224}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <XAxis dataKey="label" stroke="var(--text-faint)" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis stroke="var(--text-faint)" tickLine={false} axisLine={false} fontSize={11} domain={["dataMin - 2", "dataMax + 2"]} />
        <Tooltip
          contentStyle={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--text)",
          }}
        />
        <Line
          type="monotone"
          dataKey="weight"
          name="Greutate (kg)"
          stroke="var(--accent)"
          strokeWidth={2.5}
          dot={{ r: 3.5, fill: "var(--accent)", strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
