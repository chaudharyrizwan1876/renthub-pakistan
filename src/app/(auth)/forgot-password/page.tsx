import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Forgot password", robots: { index: false, follow: false } };

export default function ForgotPage() {
  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your account email and we will send you a reset link." footer={<Link href="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link>}>
      <ForgotForm />
    </AuthShell>
  );
}
