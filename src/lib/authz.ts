import "server-only";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "./db";

export interface SessionUser {
  id: string;
  role: Role;
  name: string;
  email: string;
}

export class ForbiddenError extends Error {
  constructor(message = "You are not allowed to do that.") {
    super(message);
  }
}

/** Reads the session AND re-validates the user + role against the database (JWTs can be stale). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await db.user.findUnique({ where: { id }, select: { id: true, role: true, name: true, email: true } });
  return user;
}

/** For server actions and route handlers: throws ForbiddenError (never redirects). */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || !roles.includes(user.role)) throw new ForbiddenError();
  return user;
}

/** For pages/layouts: redirects to the proper login. */
export async function requireOwnerPage(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");
  return user;
}

export async function requireAdminPage(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/admin/login");
  return user;
}
