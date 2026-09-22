import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Owner login", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams;
  return (
    <AuthShell
      title="Owner login"
      subtitle="Sign in to manage your property listings."
      footer={<>New here? <Link href="/signup" className="font-semibold text-primary hover:underline">Create an owner account</Link></>}
    >
      <LoginForm portal="owner" callbackUrl={callbackUrl} />
    </AuthShell>
  );
}
