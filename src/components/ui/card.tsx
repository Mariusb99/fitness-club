import { clsx } from "clsx";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("rounded-2xl border border-border bg-surface p-4 sm:p-6", className)}>
      {children}
    </div>
  );
}
