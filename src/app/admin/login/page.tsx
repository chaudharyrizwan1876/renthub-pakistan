import { ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return (
    <AuthShell title="Admin sign in" subtitle="Authorised staff only. All access is logged.">
      <p className="mb-4 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0" aria-hidden="true" /> Secure administrator portal
      </p>
      <LoginForm portal="admin" />
    </AuthShell>
  );
}
