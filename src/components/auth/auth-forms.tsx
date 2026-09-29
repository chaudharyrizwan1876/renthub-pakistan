"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { forgotPasswordAction, loginAction, resetPasswordAction, signupAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { forgotSchema, loginSchema, resetSchema, signupSchema, type LoginInput, type SignupInput } from "@/lib/validation";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Shakes the form when something fails (without remounting it, so typed values stay). */
function useShake() {
  const [on, setOn] = useState(false);
  const shake = useCallback(() => {
    setOn(false);
    setTimeout(() => setOn(true), 16);
  }, []);
  return { shake, shakeProps: { className: on ? "animate-shake" : "", onAnimationEnd: (e: React.AnimationEvent) => e.target === e.currentTarget && setOn(false) } };
}

function PasswordInput({ id, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { id: string; error?: boolean }) {
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState?.("CapsLock") ?? false);
  return (
    <div>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          aria-invalid={error || undefined}
          className="pe-11"
          onKeyUp={onKey}
          onKeyDown={onKey}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="absolute end-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <span key={show ? "hide" : "show"} className="animate-pop-in">
            {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </span>
        </button>
      </div>
      {caps && <p className="animate-slide-down mt-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">Caps Lock is on</p>}
    </div>
  );
}

/** Live password strength bar (signup / reset). */
function StrengthMeter({ value }: { value: string }) {
  if (!value) return null;
  const checks = [value.length >= 8, /[a-z]/.test(value), /[A-Z]/.test(value), /\d/.test(value), value.length >= 12 || /[^A-Za-z0-9]/.test(value)];
  const score = checks.filter(Boolean).length;
  const label = score <= 2 ? "Weak" : score === 3 ? "Fair" : score === 4 ? "Good" : "Strong";
  const color = score <= 2 ? "bg-red-500" : score === 3 ? "bg-amber-500" : score === 4 ? "bg-lime-500" : "bg-emerald-500";
  return (
    <div className="animate-slide-down mt-2" aria-live="polite">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full bg-muted transition-colors duration-300", i < score && color)} />
        ))}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Password strength: <span className="font-semibold text-foreground">{label}</span>
      </p>
    </div>
  );
}

export function LoginForm({ portal, callbackUrl }: { portal: "owner" | "admin"; callbackUrl?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { shake, shakeProps } = useShake();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { identifier: "", password: "" } });

  const onSubmit = handleSubmit(
    (values) =>
      start(async () => {
        setFormError(null);
        const res = await loginAction(values, portal, callbackUrl);
        if (!res.ok) {
          setFormError(res.error);
          shake();
          return;
        }
        setSuccess(true);
        await sleep(650); // let the tick animation play before the page changes
        router.replace(res.redirectTo);
        router.refresh();
      }),
    () => shake(),
  );

  return (
    <form onAnimationEnd={shakeProps.onAnimationEnd} onSubmit={onSubmit} noValidate className={cn("space-y-4", shakeProps.className)}>
      {formError && <div className="animate-slide-down"><FormAlert>{formError}</FormAlert></div>}
      <Field label={portal === "admin" ? "Admin email" : "Email or phone number"} htmlFor="identifier" error={errors.identifier?.message}>
        <Input id="identifier" autoComplete="username" inputMode="email" autoFocus aria-invalid={!!errors.identifier} aria-describedby={errors.identifier ? "identifier-error" : undefined} {...register("identifier")} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <PasswordInput id="password" autoComplete="current-password" error={!!errors.password} {...register("password")} />
      </Field>
      {portal === "owner" && (
        <p className="text-end text-sm">
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">Forgot password?</Link>
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" loading={pending && !success} loadingText="Signing in..." success={success} successText="Signed in! Taking you there...">
        Sign in
      </Button>
    </form>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [step, setStep] = useState<"idle" | "creating" | "signing" | "done">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const { shake, shakeProps } = useShake();
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", phone: "", whatsapp: "", password: "", confirmPassword: "" },
  });
  const password = watch("password");

  const onSubmit = handleSubmit(
    (values) =>
      start(async () => {
        setFormError(null);
        setStep("creating");
        const res = await signupAction(values);
        if (!res.ok) {
          for (const [k, msg] of Object.entries(res.fieldErrors ?? {})) setError(k as keyof SignupInput, { message: msg });
          setFormError(res.error);
          setStep("idle");
          shake();
          return;
        }
        // Sign in straight after registering
        setStep("signing");
        const login = await loginAction({ identifier: values.email, password: values.password }, "owner", "/dashboard");
        setStep("done");
        toast.success("Account created. Welcome!");
        await sleep(650);
        if (login.ok) {
          router.replace("/dashboard");
          router.refresh();
        } else router.replace("/login");
      }),
    () => shake(),
  );

  const err = (k: keyof SignupInput) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `${k}-error` : undefined });
  return (
    <form onAnimationEnd={shakeProps.onAnimationEnd} onSubmit={onSubmit} noValidate className={cn("space-y-4", shakeProps.className)}>
      {formError && <div className="animate-slide-down"><FormAlert>{formError}</FormAlert></div>}
      <Field label="Full name" htmlFor="name" error={errors.name?.message} required>
        <Input id="name" autoComplete="name" autoFocus {...err("name")} {...register("name")} />
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
        <StrengthMeter value={password} />
      </Field>
      <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message} required>
        <PasswordInput id="confirmPassword" autoComplete="new-password" error={!!errors.confirmPassword} {...register("confirmPassword")} />
      </Field>
      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={pending && step !== "done"}
        loadingText={step === "signing" ? "Signing you in..." : "Creating your account..."}
        success={step === "done"}
        successText="Account ready!"
      >
        Create owner account
      </Button>
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
  const { shake, shakeProps } = useShake();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>({ resolver: zodResolver(forgotSchema), defaultValues: { email: "" } });

  if (done) {
    return (
      <div className="animate-pop-in flex flex-col items-center gap-3 py-2 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
          <MailCheck className="size-7" aria-hidden="true" />
        </span>
        <p className="font-semibold">Check your inbox</p>
        <p className="text-sm text-muted-foreground">If an owner account exists for that email, we have sent a password reset link. It is valid for 1 hour.</p>
      </div>
    );
  }
  return (
    <form
      onAnimationEnd={shakeProps.onAnimationEnd}
      noValidate
      className={cn("space-y-4", shakeProps.className)}
      onSubmit={handleSubmit(
        (v) =>
          start(async () => {
            setFormError(null);
            const res = await forgotPasswordAction(v);
            if (res.ok) setDone(true);
            else {
              setFormError(res.error);
              shake();
            }
          }),
        () => shake(),
      )}
    >
      {formError && <div className="animate-slide-down"><FormAlert>{formError}</FormAlert></div>}
      <Field label="Email" htmlFor="email" error={errors.email?.message} required>
        <Input id="email" type="email" autoComplete="email" autoFocus aria-invalid={!!errors.email} {...register("email")} />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending} loadingText="Sending link...">
        Send reset link
      </Button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { shake, shakeProps } = useShake();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<{ token: string; password: string; confirmPassword: string }>({
    resolver: zodResolver(resetSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });
  const password = watch("password");
  return (
    <form
      onAnimationEnd={shakeProps.onAnimationEnd}
      noValidate
      className={cn("space-y-4", shakeProps.className)}
      onSubmit={handleSubmit(
        (v) =>
          start(async () => {
            setFormError(null);
            const res = await resetPasswordAction(v);
            if (!res.ok) {
              setFormError(res.error);
              shake();
              return;
            }
            setSuccess(true);
            toast.success("Password updated. Please sign in.");
            await sleep(700);
            router.replace("/login");
          }),
        () => shake(),
      )}
    >
      {formError && <div className="animate-slide-down"><FormAlert>{formError}</FormAlert></div>}
      <input type="hidden" {...register("token")} />
      <Field label="New password" htmlFor="password" error={errors.password?.message} required hint="8+ characters with upper-case, lower-case and a number">
        <PasswordInput id="password" autoComplete="new-password" error={!!errors.password} {...register("password")} />
        <StrengthMeter value={password} />
      </Field>
      <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message} required>
        <PasswordInput id="confirmPassword" autoComplete="new-password" error={!!errors.confirmPassword} {...register("confirmPassword")} />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending && !success} loadingText="Updating..." success={success} successText="Password updated!">
        Update password
      </Button>
    </form>
  );
}
