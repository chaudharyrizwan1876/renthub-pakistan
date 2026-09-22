/** Dependency-free bar chart (server component). Includes an accessible text alternative. */
export function BarChart({
  data,
  title,
  format = (n) => String(n),
  color = "var(--primary)",
}: {
  data: { label: string; value: number }[];
  title: string;
  format?: (n: number) => string;
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((n, d) => n + d.value, 0);
  return (
    <figure>
      <figcaption className="sr-only">
        {title}: {data.map((d) => `${d.label} ${format(d.value)}`).join(", ")}
      </figcaption>
      <div role="img" aria-label={`${title}. Total ${format(total)}`} className="flex h-40 items-end gap-1 sm:gap-1.5">
        {data.map((d) => (
          <div key={d.label} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] font-medium text-muted-foreground">{d.value > 0 ? format(d.value) : ""}</span>
            <div
              className="w-full rounded-t bg-current transition-opacity group-hover:opacity-80"
              style={{ height: `${Math.max(d.value > 0 ? 4 : 1, (d.value / max) * 100)}%`, color, opacity: d.value > 0 ? 1 : 0.25 }}
              title={`${d.label}: ${format(d.value)}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1 sm:gap-1.5" aria-hidden="true">
        {data.map((d, i) => (
          <span key={d.label} className="min-w-0 flex-1 truncate text-center text-[10px] text-muted-foreground">
            {data.length > 8 && i % 2 === 1 ? "" : d.label}
          </span>
        ))}
      </div>
    </figure>
  );
}

export function HBar({ items }: { items: { label: string; value: number; className?: string }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{i.label}</span>
            <span className="font-semibold">{i.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded bg-muted">
            <div className={i.className ?? "bg-primary"} style={{ width: `${(i.value / max) * 100}%`, height: "100%" }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
