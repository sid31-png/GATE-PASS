import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { roleOf } from "@/lib/rbac";
import { isRouteAllowed } from "@/lib/route-access";

// Real server-side route guarding (Proxy runs on the Node.js runtime by
// default in this Next.js version, before any page or API route handler).
// This is the enforcement layer — it does not just hide UI, it blocks the
// request itself. See src/lib/route-access.ts for the per-page role rules.

const PUBLIC_API_PREFIXES = ["/api/auth/login", "/api/auth/profiles"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login" || PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  const isApi = pathname.startsWith("/api");

  if (!session) {
    if (isApi) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!isApi) {
    const role = roleOf(session);
    if (!isRouteAllowed(pathname, role)) {
      const deniedUrl = new URL("/", request.url);
      deniedUrl.searchParams.set("denied", pathname);
      return NextResponse.redirect(deniedUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|rch-logo.png).*)"],
};
