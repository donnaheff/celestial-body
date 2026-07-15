import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Deliberately built on the edge-safe auth.config.ts (no adapter, no
// Credentials, no DB import) so middleware never bundles the `pg` driver.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const isAdmin = req.auth?.user?.role === "admin";

  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    const url = new URL("/sign-in", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && !isAdmin) {
    const url = new URL(isLoggedIn ? "/dashboard" : "/sign-in", req.nextUrl.origin);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
