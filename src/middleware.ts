import { createI18nMiddleware } from "fumadocs-core/i18n/middleware";
import { getIronSession } from "iron-session";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { type SessionData, sessionOptions } from "~/lib/siwe-session";
import { i18n } from "~/utils/i18n";

const i18nMiddleware = createI18nMiddleware({
  ...i18n,
  format: (locale, path) => `/${locale}/${path}`,
});

const protectedPaths = ["/activity", "/bookmarks"] as const;

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // i18n only inside /docs, but skip root to allow Next redirect to /docs/overview
  if (path.startsWith("/docs") && path !== "/docs") {
    const res = i18nMiddleware(request, { waitUntil() {} } as unknown as NextFetchEvent);
    if (res) return res;
  }

  // Auth gate for protected paths
  const isProtectedPath = protectedPaths.some(
    (protectedPath) => path === protectedPath || path.startsWith(`${protectedPath}/`),
  );

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  try {
    const res = NextResponse.next();
    const session = await getIronSession<SessionData>(request, res, sessionOptions);

    if (!session.siwe?.address) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const now = new Date();
    const expirationTime = new Date(session.siwe.expirationTime);

    if (now > expirationTime) {
      session.destroy();
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return res;
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  // Run on everything except api/static assets; i18n logic self-limits to /docs
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
