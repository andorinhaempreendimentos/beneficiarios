import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const STORAGE_KEY = "andorinha_auth";

// Rotas que não precisam de autenticação
const PUBLIC_PATHS = [
  "/login",
  "/inscricao",
  "/ponto",
];

// Rotas exclusivas de admin (tipo !== "funcionario" && tipo !== "beneficiario")
const ADMIN_PATHS = ["/"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  // Lê sessão do cookie (salvarSessao escreve em localStorage — não acessível no middleware)
  // Usamos um cookie espelho "auth_type" gravado no login para proteção de rota
  const authType = request.cookies.get("auth_type")?.value;

  // Não autenticado → redireciona para /login
  if (!authType) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Beneficiário tentando acessar área admin ou de funcionário
  if (authType === "beneficiario" && !pathname.startsWith("/horarios")) {
    return NextResponse.redirect(new URL("/horarios", request.url));
  }

  // Funcionário tentando acessar área admin
  if (authType === "funcionario" && !pathname.startsWith("/agenda")) {
    return NextResponse.redirect(new URL("/agenda", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
