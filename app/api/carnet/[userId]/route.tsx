import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  ROLES_FUNCIONARIOS,
  formatearRut,
  esPresidenteCorteSuprema,
} from "@/lib/identidad";
import { obtenerAvatarRobloxDataUri } from "@/lib/roblox";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NOMBRE_ROL: Record<string, string> = {
  ADMIN: "Ministro de Corte Suprema",
  JUEZ: "Juez de la República",
  FISCAL: "Fiscal Adjunto",
  FUNCIONARIO: "Funcionario Judicial",
};

async function generarPlacaSvg({
  nombreIC,
  rut,
  cargo,
  rol,
  fotoDataUri,
}: {
  nombreIC: string;
  rut: string;
  cargo: string;
  rol: string;
  fotoDataUri?: string | null;
}): Promise<string> {
  const esFiscalia = rol === "FISCAL";
  const colorPrimario = esFiscalia ? "#0f2e5c" : "#0a192f";
  const colorSecundario = esFiscalia ? "#174785" : "#112240";
  const colorDetalle = esFiscalia ? "#79b2fc" : "#b3924b";
  const tituloEntidad = esFiscalia ? "MINISTERIO PUBLICO" : "PODER JUDICIAL";
  const subtituloEntidad = esFiscalia ? "FISCALIA DE CHILE" : "REPUBLICA DE CHILE";
  const siglasSello = esFiscalia ? "MP" : "PJUD";
  const colorTextoCargo = esFiscalia ? "#dc2626" : "#0a192f";
  const textoFooter = esFiscalia ? "DOCUMENTO INTERNO" : "MINISTERIO DE JUSTICIA";

  const width = 360;
  const height = 560;

  // Imagen de avatar (si existe)
  let avatarSvg = "";
  if (fotoDataUri) {
    avatarSvg = `<image href="${fotoDataUri}" x="87" y="138" width="188" height="188" preserveAspectRatio="xMidYMid slice" />`;
  } else {
    const initials = (nombreIC || "?").trim().slice(0, 2).toUpperCase();
    avatarSvg = `<text x="180" y="240" font-size="72" font-weight="bold" fill="${colorPrimario}" text-anchor="middle" dominant-baseline="middle">${initials}</text>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${colorPrimario};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colorSecundario};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Fondo blanco -->
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  
  <!-- Bordes redondeados -->
  <rect x="0" y="0" width="${width}" height="${height}" rx="16" ry="16" fill="none" stroke="#0a192f" stroke-width="2"/>
  
  <!-- Encabezado degradado -->
  <rect x="0" y="0" width="${width}" height="118" fill="url(#headerGrad)" rx="16" ry="16"/>
  
  <!-- Título -->
  <text x="${width / 2}" y="38" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="Arial, sans-serif">${tituloEntidad}</text>
  
  <!-- Subtítulo -->
  <text x="${width / 2}" y="60" font-size="11" font-weight="bold" fill="${colorDetalle}" text-anchor="middle" font-family="Arial, sans-serif">${subtituloEntidad}</text>
  
  <!-- Círculo con sello -->
  <circle cx="${width / 2}" cy="100" r="24" fill="${colorPrimario}" stroke="${colorDetalle}" stroke-width="2"/>
  <text x="${width / 2}" y="105" font-size="14" font-weight="bold" fill="${colorDetalle}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif">${siglasSello}</text>
  
  <!-- Caja de foto -->
  <rect x="86" y="138" width="188" height="188" fill="#f3f4f6" stroke="${colorPrimario}" stroke-width="2" rx="4"/>
  ${avatarSvg}
  
  <!-- Labels y datos -->
  <text x="24" y="352" font-size="9" font-weight="bold" fill="#6b7280" font-family="Arial, sans-serif">FUNCIONARIO / MAGISTRADO</text>
  <text x="24" y="375" font-size="16" font-weight="bold" fill="#111827" font-family="Arial, sans-serif">${nombreIC}</text>
  
  <text x="24" y="410" font-size="9" font-weight="bold" fill="#6b7280" font-family="Arial, sans-serif">RUN / RUT NACIONAL</text>
  <text x="24" y="433" font-size="15" font-weight="bold" fill="#111827" font-family="Arial, sans-serif">${formatearRut(rut)}</text>
  
  <!-- QR placeholder -->
  <rect x="246" y="330" width="82" height="82" fill="#ffffff" stroke="#0a192f" stroke-width="2"/>
  <text x="287" y="371" font-size="10" font-weight="bold" fill="#0a192f" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif">QR CODE</text>
  
  <!-- Barcode placeholder -->
  <rect x="246" y="422" width="82" height="28" fill="#ffffff" stroke="#0a192f" stroke-width="1"/>
  <text x="287" y="437" font-size="8" font-weight="bold" fill="#0a192f" text-anchor="middle" dominant-baseline="middle" font-family="monospace">BARCODE</text>
  
  <!-- Cargo -->
  <rect x="22" y="462" width="316" height="42" fill="#dbe8f6" stroke="#0a192f" stroke-width="1" rx="2"/>
  <line x1="26" y1="462" x2="26" y2="504" stroke="${colorDetalle}" stroke-width="3"/>
  <text x="34" y="478" font-size="8" font-weight="bold" fill="#6b7280" font-family="Arial, sans-serif">CARGO INSTITUCIONAL</text>
  <text x="34" y="500" font-size="14" font-weight="bold" fill="${colorTextoCargo}" font-family="Arial, sans-serif">${cargo}</text>
  
  <!-- Footer -->
  <rect x="0" y="524" width="${width}" height="36" fill="${colorPrimario}"/>
  <line x1="0" y1="524" x2="${width}" y2="524" stroke="${colorDetalle}" stroke-width="2"/>
  <text x="20" y="546" font-size="11" font-weight="bold" fill="#dfeaff" font-family="monospace">|||| |||| ||||</text>
  <text x="${width - 20}" y="546" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="end" font-family="Arial, sans-serif">${textoFooter}</text>
</svg>`;
}

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as any)?.id as string | undefined;
    const sessionRol = (session?.user as any)?.rol as string | undefined;

    if (!sessionUserId || (sessionUserId !== params.userId && sessionRol !== "ADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const usuario = await prisma.user.findUnique({ where: { id: params.userId } });
    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    if (!ROLES_FUNCIONARIOS.includes(usuario.rol)) {
      return NextResponse.json({ error: "Este rol no emite identificación institucional" }, { status: 400 });
    }
    if (!usuario.nombreIC || !usuario.rut) {
      return NextResponse.json({ error: "Faltan datos de identidad (nombre o RUT)" }, { status: 400 });
    }

    const esPresidente = esPresidenteCorteSuprema(usuario.discordId);
    const cargo = esPresidente ? "Presidente de la Corte Suprema" : NOMBRE_ROL[usuario.rol] ?? usuario.rol;

    let fotoFinal: string | null = null;
    try {
      const fotoRoblox = usuario.robloxUsername
        ? await obtenerAvatarRobloxDataUri(usuario.robloxUsername)
        : null;

      if (fotoRoblox) {
        fotoFinal = fotoRoblox;
      } else if (usuario.image) {
        const resImg = await fetch(usuario.image, { cache: "no-store" });
        if (resImg.ok) {
          const bytes = Buffer.from(await resImg.arrayBuffer());
          const contentType = resImg.headers.get("content-type") ?? "image/png";
          fotoFinal = `data:${contentType};base64,${bytes.toString("base64")}`;
        }
      }
    } catch (error) {
      console.warn("No se pudo mapear la imagen de perfil:", error);
      fotoFinal = null;
    }

    const svgContent = await generarPlacaSvg({
      nombreIC: usuario.nombreIC,
      rut: usuario.rut,
      cargo,
      rol: usuario.rol,
      fotoDataUri: fotoFinal,
    });

    const filename = `credencial_${usuario.nombreIC.toLowerCase().replace(/\s+/g, "_")}.svg`;

    return new NextResponse(svgContent, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error crítico en endpoint de carnet:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
