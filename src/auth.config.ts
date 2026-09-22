import type { NextAuthConfig } from "next-auth";

/**
 * Edge/proxy-safe part of the Auth.js config (no DB, no bcrypt).
 * Route gating lives here; every server action / route handler ALSO re-checks the role (see lib/authz.ts).
 */
export const authConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      if (token.role) session.user.role = token.role;
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const path = nextUrl.pathname;
      const role = auth?.user?.role;
      const go = (to: string) => Response.redirect(new URL(to, nextUrl));

      if (path === "/admin/login") return role === "ADMIN" ? go("/admin") : true;
      if (path.startsWith("/admin")) return role === "ADMIN" ? true : go("/admin/login");

      if (path.startsWith("/dashboard")) {
        if (role === "OWNER") return true;
        if (role === "ADMIN") return go("/admin");
        return go(`/login?callbackUrl=${encodeURIComponent(path)}`);
      }

      if (path === "/login" || path === "/signup") {
        if (role === "OWNER") return go("/dashboard");
        if (role === "ADMIN") return go("/admin");
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
