import { Breadcrumbs } from "@/components/seo/breadcrumbs";

export function StaticPage({ title, path, updated, children }: { title: string; path: string; updated?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: title, path }]} />
      <h1 className="mt-4 text-3xl font-extrabold">{title}</h1>
      {updated && <p className="mt-1 text-sm text-muted-foreground">Last updated: {updated}</p>}
      <div className="mt-6 space-y-4 leading-relaxed text-foreground/90 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ms-5 [&_li]:list-disc [&_a]:font-medium [&_a]:text-primary [&_a]:underline">
        {children}
      </div>
    </div>
  );
}
