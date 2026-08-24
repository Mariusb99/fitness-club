import type { ComponentType } from "react";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  suffix,
  hint,
  icon: Icon,
  accentBar,
}: {
  label: string;
  value: string;
  suffix?: string;
  hint: string;
  icon: ComponentType<{ className?: string }>;
  accentBar?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="mb-4 flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {label}
        </span>
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <p className="text-3xl font-semibold tracking-tight">
        {value}
        {suffix && <span className="ml-1 text-lg font-medium text-text-muted">{suffix}</span>}
      </p>
      <p className="mt-1 text-xs text-text-muted">{hint}</p>
      {accentBar && (
        <span className="absolute inset-x-0 bottom-0 h-1 bg-accent" aria-hidden />
      )}
    </Card>
  );
}
