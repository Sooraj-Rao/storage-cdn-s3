import { verifyToken } from "@/app/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value
  const { pathname } = request.nextUrl

  const protectedRoutes = ["/dashboard", "/upload"]
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute) {
    if (!token || !verifyToken(token)) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  if (pathname === "/" || pathname === "/register") {
    if (token && verifyToken(token)) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
