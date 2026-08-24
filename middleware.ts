import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Mapa de qué roles pueden entrar a qué sección del dashboard
const rutasPorRol: Record<string, string[]> = {
  "/dashboard/admin": ["ADMIN", "PRESIDENTE_CORTE"],
  "/dashboard/juez": ["ADMIN", "PRESIDENTE_CORTE", "JUEZ"],
  "/dashboard/fiscal": ["ADMIN", "PRESIDENTE_CORTE", "FISCAL"],
  "/dashboard/abogado": ["ADMIN", "PRESIDENTE_CORTE", "ABOGADO"],
  "/dashboard/parte": ["ADMIN", "PRESIDENTE_CORTE", "CIUDADANO", "JUEZ", "FISCAL", "ABOGADO", "FUNCIONARIO"],
};

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const rol = (req.nextauth.token as any)?.rol ?? "CIUDADANO";

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
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/causas/:path*", "/audiencias/:path*"],
};
