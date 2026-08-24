import { clsx } from "clsx";

const VARIANTS = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-surface-2 text-text-muted",
  accent: "bg-accent-soft text-accent",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
