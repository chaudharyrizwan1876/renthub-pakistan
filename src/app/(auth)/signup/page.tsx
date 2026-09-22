import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/auth-forms";

export const metadata = { title: "List your property for rent", robots: { index: false, follow: false } };

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your owner account"
      subtitle="Free to list. Tenants can never see your phone number or address."
      footer={<>Already registered? <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link></>}
    >
      <SignupForm />
    </AuthShell>
  );
}
