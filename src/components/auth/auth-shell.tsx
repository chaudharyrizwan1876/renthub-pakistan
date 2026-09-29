import Link from "next/link";
import { Logo } from "@/components/layout/site-header";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-muted/40">
      <div aria-hidden="true" className="animate-float pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-primary/15 blur-3xl" />
      <div aria-hidden="true" className="animate-float pointer-events-none absolute -right-20 bottom-10 size-80 rounded-full bg-accent/10 blur-3xl [animation-delay:-4s]" />
      <div className="relative mx-auto w-full max-w-md px-4 pt-8">
        <div className="flex items-center justify-between"><Logo /><ThemeToggle /></div>
      </div>
      <main id="main" className="relative mx-auto w-full max-w-md flex-1 px-4 py-8">
        <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/5 sm:p-8">
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
