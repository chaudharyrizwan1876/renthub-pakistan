import { cn } from "@/lib/utils";
import { STATUS_META } from "@/lib/constants";
import type { ListingStatus } from "@prisma/client";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-border bg-card", className)} {...props} />;
}

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export function StatusBadge({ status }: { status: ListingStatus }) {
  const m = STATUS_META[status];
  return <Badge className={m.className}>{m.label}</Badge>;
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative overflow-hidden rounded-md bg-muted before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.4s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent dark:before:via-white/10", className)}
    />
  );
}

export function EmptyState({
  title,
  children,
  action,
  className,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center", className)}>
      <div aria-hidden="true" className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-muted text-2xl">🏠</div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {children && <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{children}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
