import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/auth-forms";
import { FormAlert } from "@/components/ui/form";

export const metadata = { title: "Reset password", robots: { index: false, follow: false } };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Choose a new password" footer={<Link href="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link>}>
      {token && /^[a-f0-9]{64}$/.test(token) ? (
        <ResetForm token={token} />
      ) : (
        <FormAlert>This reset link is invalid. Please <Link href="/forgot-password" className="underline">request a new one</Link>.</FormAlert>
      )}
    </AuthShell>
  );
}
