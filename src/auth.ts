import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { db } from "./lib/db";
import { rateLimit } from "./lib/rate-limit";
import { ipFromHeaders } from "./lib/request";
import { loginSchema, toLocalPhone } from "./lib/validation";

export class RateLimitedError extends CredentialsSignin {
  code = "rate_limited";
}

// Used to keep response time constant when the user doesn't exist.
let dummyHash: string | undefined;
const getDummyHash = () => (dummyHash ??= bcrypt.hashSync("not-a-real-password", 12));

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Email or phone", type: "text" },
        password: { label: "Password", type: "password" },
        portal: { label: "Portal", type: "text" },
      },
      async authorize(raw, request) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { identifier, password } = parsed.data;
        const portal = raw?.portal === "admin" ? "admin" : "owner";

        // Rate limit here (not only in the form action) so direct POSTs to /api/auth are covered too.
        const ip = ipFromHeaders(request.headers);
        const [byIp, byId] = await Promise.all([
          rateLimit(`login:ip:${ip}`, 30, 15 * 60),
          rateLimit(`login:id:${identifier.toLowerCase()}`, 8, 15 * 60),
        ]);
        if (!byIp.ok || !byId.ok) throw new RateLimitedError();

        const isEmail = identifier.includes("@");
        const phone = isEmail ? null : toLocalPhone(identifier);
        if (!isEmail && !phone) {
          await bcrypt.compare(password, getDummyHash());
          return null;
        }
        const user = await db.user.findUnique({
          where: isEmail ? { email: identifier.toLowerCase() } : { phone: phone! },
        });
        const valid = await bcrypt.compare(password, user?.passwordHash ?? getDummyHash());
        if (!user || !valid) return null;

        // Separate portals: admins sign in at /admin/login, owners at /login.
        if (portal === "admin" && user.role !== "ADMIN") return null;
        if (portal === "owner" && user.role !== "OWNER") return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
});
