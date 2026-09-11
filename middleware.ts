import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Mapa de qué roles pueden entrar a qué sección del dashboard
const rutasPorRol: Record<string, string[]> = {
  "/dashboard/admin": ["ADMIN"],
  "/dashboard/juez": ["ADMIN", "JUEZ"],
  "/dashboard/fiscal": ["ADMIN", "FISCAL"],
  "/dashboard/abogado": ["ADMIN", "ABOGADO"],
  "/dashboard/funcionario": ["ADMIN", "FUNCIONARIO"],
  "/dashboard/parte": ["ADMIN", "CIUDADANO", "JUEZ", "FISCAL", "ABOGADO", "FUNCIONARIO"],
  "/mis-causas": ["ADMIN", "CIUDADANO", "JUEZ", "FISCAL", "ABOGADO", "FUNCIONARIO"],
};

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const rol = (req.nextauth.token as any)?.rol ?? "CIUDADANO";
    const perfilCompleto = (req.nextauth.token as any)?.perfilCompleto;
    const passwordConfigurada = (req.nextauth.token as any)?.passwordConfigurada;

    if (pathname !== "/perfil" && pathname !== "/login" && (perfilCompleto === false || passwordConfigurada === false)) {
      return NextResponse.redirect(new URL("/perfil?setup=1", req.url));
    }

    const seccion = Object.keys(rutasPorRol).find((ruta) => pathname.startsWith(ruta));
    if (seccion && !rutasPorRol[seccion].includes(rol)) {
      return NextResponse.redirect(new URL("/dashboard?error=sin-permiso", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/ovj",
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/mis-causas/:path*", "/causas/:path*", "/audiencias/:path*", "/escritos/:path*", "/actas/:path*", "/ordenes-captura/:path*", "/ingreso-causas"],
};
