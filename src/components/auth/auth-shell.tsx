import Link from "next/link";
import { Logo } from "@/components/layout/site-header";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/40">
      <div className="mx-auto w-full max-w-md px-4 pt-8">
        <div className="flex items-center justify-between"><Logo /><ThemeToggle /></div>
      </div>
      <main id="main" className="mx-auto w-full max-w-md flex-1 px-4 py-8">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>}
        <p className="mt-6 text-center text-sm"><Link href="/" className="text-muted-foreground hover:underline">← Back to website</Link></p>
      </main>
    </div>
  );
}
