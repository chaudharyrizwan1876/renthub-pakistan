import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Next.js 16 "proxy" (formerly middleware): first line of role-based route protection.
// The `authorized` callback in auth.config.ts decides who may enter /admin, /dashboard, /login.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/login", "/signup"],
};
