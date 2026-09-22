import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <p className="text-6xl font-extrabold text-primary">404</p>
        <h1 className="mt-3 text-2xl font-bold">We could not find that page</h1>
        <p className="mt-2 text-muted-foreground">The listing may have been rented out or the link is incorrect.</p>
        <div className="mt-6 flex gap-3">
          <Button asChild><Link href="/listings">Browse rentals</Link></Button>
          <Button asChild variant="outline"><Link href="/">Go home</Link></Button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
