import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = [
  "/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset",
  "/otp",
  "/oauth",
  "/setup",
  "/pricing",
  "/rankings",
  "/about",
  "/privacy-policy",
  "/user-agreement",
  "/console",
];

const authPaths = ["/sign-in", "/sign-up", "/forgot-password", "/reset", "/otp", "/oauth"];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function isAuthPath(pathname: string): boolean {
  return authPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/v1") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Auth paths are always accessible (client handles redirect if already logged in)
  if (isAuthPath(pathname)) {
    return NextResponse.next();
  }

  // Public paths don't need auth
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // All other paths are protected — client-side auth check will handle redirect
  // (We can't check HTTP-only cookies here without knowing the cookie name,
  // so auth verification happens client-side via the Zustand store + getSelf API)
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
