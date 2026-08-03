import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/inscricao", "/ponto"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const authType = request.cookies.get("auth_type")?.value;

  if (!authType) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (authType === "beneficiario" && !pathname.startsWith("/horarios")) {
    return NextResponse.redirect(new URL("/horarios", request.url));
  }

  if (authType === "funcionario" && !pathname.startsWith("/agenda")) {
    return NextResponse.redirect(new URL("/agenda", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)" ],
};
