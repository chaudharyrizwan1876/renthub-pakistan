"use server";

import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { SITE } from "@/lib/site";
import { forgotSchema, loginSchema, resetSchema, signupSchema, toLocalPhone } from "@/lib/validation";
import { fail, flattenZod, type ActionResult } from "./result";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

function safeCallback(url: string | undefined, fallback: string): string {
  if (!url || !url.startsWith("/") || url.startsWith("//") || url.includes("\\")) return fallback;
  return url.startsWith("/dashboard") ? url : fallback;
}

export async function signupAction(raw: unknown): Promise<ActionResult> {
  const ip = await getClientIp();
  const limit = await rateLimit(`signup:${ip}`, 6, 60 * 60);
  if (!limit.ok) return fail("Too many sign-up attempts. Please try again later.");

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) return fail("Please fix the highlighted fields.", flattenZod(parsed.error.issues));
  const { name, email, phone, whatsapp, password } = parsed.data;
  const localPhone = toLocalPhone(phone)!;

  const existing = await db.user.findFirst({ where: { OR: [{ email }, { phone: localPhone }] }, select: { email: true } });
  if (existing) {
    return fail("An account with this email or phone number already exists.", {
      [existing.email === email ? "email" : "phone"]: "Already registered",
    });
  }

  await db.user.create({
    data: {
      name,
      email,
      phone: localPhone,
      whatsapp: whatsapp ? toLocalPhone(whatsapp) : localPhone,
      passwordHash: await bcrypt.hash(password, 12),
      role: "OWNER",
    },
  });
  return { ok: true };
}

export async function loginAction(
  raw: unknown,
  portal: "owner" | "admin",
  callbackUrl?: string,
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return fail("Enter your email/phone and password.", flattenZod(parsed.error.issues));
  try {
    await signIn("credentials", { ...parsed.data, portal, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) {
      const code = (e as AuthError & { code?: string }).code;
      if (code === "rate_limited") return fail("Too many attempts. Please wait a few minutes and try again.");
      return fail("Incorrect email/phone or password.");
    }
    throw e;
  }
  return { ok: true, redirectTo: portal === "admin" ? "/admin" : safeCallback(callbackUrl, "/dashboard") };
}

export async function logoutAction(redirectTo = "/") {
  await signOut({ redirectTo });
}

export async function forgotPasswordAction(raw: unknown): Promise<ActionResult> {
  const parsed = forgotSchema.safeParse(raw);
  if (!parsed.success) return fail("Enter a valid email address.", flattenZod(parsed.error.issues));
  const ip = await getClientIp();
  const [a, b] = await Promise.all([
    rateLimit(`forgot:ip:${ip}`, 6, 60 * 60),
    rateLimit(`forgot:email:${parsed.data.email}`, 3, 60 * 60),
  ]);
  if (!a.ok || !b.ok) return fail("Too many requests. Please try again later.");

  const user = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true, email: true, role: true } });
  if (user && user.role === "OWNER") {
    const token = randomBytes(32).toString("hex");
    await db.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await db.passwordResetToken.create({
      data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    await sendPasswordResetEmail(user.email, `${SITE.url}/reset-password?token=${token}`);
  }
  // Same response whether or not the account exists (no user enumeration).
  return { ok: true };
}

export async function resetPasswordAction(raw: unknown): Promise<ActionResult> {
  const parsed = resetSchema.safeParse(raw);
  if (!parsed.success) return fail("Please fix the highlighted fields.", flattenZod(parsed.error.issues));
  const ip = await getClientIp();
  const limit = await rateLimit(`reset:${ip}`, 10, 60 * 60);
  if (!limit.ok) return fail("Too many attempts. Please try again later.");

  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: sha256(parsed.data.token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return fail("This reset link is invalid or has expired.");

  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) } }),
    db.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);
  return { ok: true };
}
