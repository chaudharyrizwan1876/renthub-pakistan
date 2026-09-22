"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { forgotPasswordAction, loginAction, resetPasswordAction, signupAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input } from "@/components/ui/form";
import { forgotSchema, loginSchema, resetSchema, signupSchema, type LoginInput, type SignupInput } from "@/lib/validation";

function PasswordInput({ id, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { id: string; error?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input id={id} type={show ? "text" : "password"} aria-invalid={error || undefined} className="pe-11" {...props} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute end-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </div>
  );
}

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </Button>
  );
}

export function LoginForm({ portal, callbackUrl }: { portal: "owner" | "admin"; callbackUrl?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { identifier: "", password: "" } });

  const onSubmit = handleSubmit((values) =>
    start(async () => {
      setFormError(null);
      const res = await loginAction(values, portal, callbackUrl);
      if (!res.ok) return setFormError(res.error);
      router.replace(res.redirectTo);
      router.refresh();
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && <FormAlert>{formError}</FormAlert>}
      <Field label={portal === "admin" ? "Admin email" : "Email or phone number"} htmlFor="identifier" error={errors.identifier?.message}>
        <Input id="identifier" autoComplete="username" inputMode="email" aria-invalid={!!errors.identifier} aria-describedby={errors.identifier ? "identifier-error" : undefined} {...register("identifier")} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <PasswordInput id="password" autoComplete="current-password" error={!!errors.password} {...register("password")} />
      </Field>
      {portal === "owner" && (
        <p className="text-end text-sm">
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">Forgot password?</Link>
        </p>
      )}
      <Submit pending={pending}>Sign in</Submit>
    </form>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", phone: "", whatsapp: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit((values) =>
    start(async () => {
      setFormError(null);
      const res = await signupAction(values);
      if (!res.ok) {
        for (const [k, msg] of Object.entries(res.fieldErrors ?? {})) setError(k as keyof SignupInput, { message: msg });
        return setFormError(res.error);
      }
      // Sign in straight after registering
      const login = await loginAction({ identifier: values.email, password: values.password }, "owner", "/dashboard");
      toast.success("Account created. Welcome!");
      if (login.ok) {
        router.replace("/dashboard");
        router.refresh();
      } else router.replace("/login");
    }),
  );

  const err = (k: keyof SignupInput) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `${k}-error` : undefined });
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && <FormAlert>{formError}</FormAlert>}
      <Field label="Full name" htmlFor="name" error={errors.name?.message} required>
        <Input id="name" autoComplete="name" {...err("name")} {...register("name")} />
      </Field>
      <Field label="Email" htmlFor="email" error={errors.email?.message} required>
        <Input id="email" type="email" autoComplete="email" inputMode="email" {...err("email")} {...register("email")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone" htmlFor="phone" error={errors.phone?.message} required hint="e.g. 0300 1234567">
          <Input id="phone" type="tel" autoComplete="tel" inputMode="tel" {...err("phone")} {...register("phone")} />
        </Field>
        <Field label="WhatsApp (optional)" htmlFor="whatsapp" error={errors.whatsapp?.message} hint="Leave empty if same as phone">
          <Input id="whatsapp" type="tel" inputMode="tel" {...err("whatsapp")} {...register("whatsapp")} />
        </Field>
      </div>
      <Field label="Password" htmlFor="password" error={errors.password?.message} required hint="8+ characters with upper-case, lower-case and a number">
        <PasswordInput id="password" autoComplete="new-password" error={!!errors.password} {...register("password")} />
      </Field>
      <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message} required>
        <PasswordInput id="confirmPassword" autoComplete="new-password" error={!!errors.confirmPassword} {...register("confirmPassword")} />
      </Field>
      <Submit pending={pending}>Create owner account</Submit>
      <p className="text-center text-xs text-muted-foreground">
        By creating an account you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy-policy" className="underline">Privacy Policy</Link>.
      </p>
    </form>
  );
}

export function ForgotForm() {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>({ resolver: zodResolver(forgotSchema), defaultValues: { email: "" } });

  if (done) {
    return <FormAlert tone="success">If an owner account exists for that email, we have sent a password reset link. It is valid for 1 hour.</FormAlert>;
  }
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit((v) =>
        start(async () => {
          setFormError(null);
          const res = await forgotPasswordAction(v);
          if (res.ok) setDone(true);
          else setFormError(res.error);
        }),
      )}
    >
      {formError && <FormAlert>{formError}</FormAlert>}
      <Field label="Email" htmlFor="email" error={errors.email?.message} required>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
      </Field>
      <Submit pending={pending}>Send reset link</Submit>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ token: string; password: string; confirmPassword: string }>({
    resolver: zodResolver(resetSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit((v) =>
        start(async () => {
          setFormError(null);
          const res = await resetPasswordAction(v);
          if (!res.ok) return setFormError(res.error);
          toast.success("Password updated. Please sign in.");
          router.replace("/login");
        }),
      )}
    >
      {formError && <FormAlert>{formError}</FormAlert>}
      <input type="hidden" {...register("token")} />
      <Field label="New password" htmlFor="password" error={errors.password?.message} required hint="8+ characters with upper-case, lower-case and a number">
        <PasswordInput id="password" autoComplete="new-password" error={!!errors.password} {...register("password")} />
      </Field>
      <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message} required>
        <PasswordInput id="confirmPassword" autoComplete="new-password" error={!!errors.confirmPassword} {...register("confirmPassword")} />
      </Field>
      <Submit pending={pending}>Update password</Submit>
    </form>
  );
}
