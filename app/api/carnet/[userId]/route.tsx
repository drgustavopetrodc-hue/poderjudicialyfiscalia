import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  ROLES_FUNCIONARIOS,
  INSTITUCION_POR_ROL,
  formatearRut,
  esPresidenteCorteSuprema,
  generarNifFiscal,
} from "@/lib/identidad";
import { obtenerAvatarRobloxDataUri } from "@/lib/roblox";

export const dynamic = "force-dynamic";

const NOMBRE_ROL: Record<string, string> = {
  ADMIN: "Ministro de Corte Suprema",
  JUEZ: "Juez",
  FISCAL: "Fiscal",
  FUNCIONARIO: "Funcionario",
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildCarnetSvg({
  nombreIC,
  rut,
  cargo,
  nif,
  institucion,
  fotoDataUri,
}: {
  nombreIC: string;
  rut: string;
  cargo: string;
  nif?: string | null;
  institucion: string;
  fotoDataUri?: string | null;
}): string {
  const nombre = escapeXml(nombreIC);
  const rutFormateado = escapeXml(formatearRut(rut));
  const cargoEscapado = escapeXml(cargo);
  const nifEscapado = nif ? escapeXml(nif) : "";
  const institucionEscapada = escapeXml(institucion);
  const iniciales = escapeXml((nombreIC || "?").trim().slice(0, 2).toUpperCase() || "MP");
  const fotoNode = fotoDataUri
    ? `<image href="${escapeXml(fotoDataUri)}" x="142" y="178" width="156" height="180" preserveAspectRatio="xMidYMid slice" />`
    : `<text x="220" y="280" font-size="44" font-weight="700" text-anchor="middle" fill="#0f2444">${iniciales}</text>`;

  return `
    <svg width="640" height="1000" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Carnet institucional">
      <defs>
        <linearGradient id="bgHeader" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#0f2444" />
          <stop offset="100%" stop-color="#153c6f" />
        </linearGradient>
        <linearGradient id="bgBody" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#f7f9fc" />
          <stop offset="100%" stop-color="#eef3fb" />
        </linearGradient>
      </defs>
      <rect width="640" height="1000" fill="#1d1f22" />
      <g transform="translate(140 150)">
        <rect width="360" height="560" rx="18" fill="url(#bgBody)" stroke="#0f2444" stroke-width="3" />
        <rect x="0" y="0" width="360" height="120" fill="url(#bgHeader)" rx="18" />
        <text x="180" y="34" text-anchor="middle" font-size="18" font-weight="800" fill="#ffffff" letter-spacing="3">MINISTERIO PÚBLICO</text>
        <text x="180" y="60" text-anchor="middle" font-size="11" font-weight="700" fill="#9fc6ff" letter-spacing="2">${institucionEscapada}</text>

        <circle cx="180" cy="112" r="34" fill="#d7e8ff" stroke="#ffffff" stroke-width="2" />
        <text x="180" y="121" text-anchor="middle" font-size="18" font-weight="800" fill="#0f2444">MP</text>

        <rect x="102" y="158" width="156" height="180" rx="10" fill="#dfe7f3" stroke="#0f2444" stroke-width="3" overflow="hidden"/>
        ${fotoNode}

        <text x="22" y="370" font-size="9" fill="#6b7d95" font-weight="700" letter-spacing="1.4">NOMBRE FUNCIONARIO</text>
        <text x="22" y="395" font-size="18" font-weight="800" fill="#0f2444">${nombre}</text>

        <text x="22" y="440" font-size="9" fill="#6b7d95" font-weight="700" letter-spacing="1.4">RUT INSTITUCIONAL</text>
        <text x="22" y="465" font-size="18" font-weight="800" fill="#0f2444">${rutFormateado}</text>

        ${nif ? `
          <text x="22" y="510" font-size="9" fill="#6b7d95" font-weight="700" letter-spacing="1.4">NIF</text>
          <text x="22" y="535" font-size="16" font-weight="800" fill="#0f2444">${nifEscapado}</text>
        ` : ""}

        <rect x="22" y="550" width="316" height="52" rx="8" fill="#edf4ff" stroke="#153c6f" stroke-width="2" />
        <text x="34" y="575" font-size="9" fill="#6b7d95" font-weight="700" letter-spacing="1.4">CARGO OFICIAL</text>
        <text x="34" y="596" font-size="18" font-weight="800" fill="#b51f2a">${cargoEscapado}</text>

        <rect width="360" height="40" y="520" fill="#0f2444" rx="0" />
        <text x="20" y="547" font-size="9" fill="#dfeaff" font-weight="700" letter-spacing="3">|||| |||| ||||</text>
        <text x="290" y="547" font-size="9" fill="#ffffff" font-weight="700" letter-spacing="2">DOCUMENTO INTERNO</text>
      </g>
    </svg>
  `;
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

    const institucion = usuario.institucion || INSTITUCION_POR_ROL[usuario.rol] || "Estado de Chile";
    const esPresidente = esPresidenteCorteSuprema(usuario.discordId);
    const cargo = esPresidente ? "Presidente de la Corte Suprema" : NOMBRE_ROL[usuario.rol] ?? usuario.rol;
    const nif = (usuario as any).nif || (usuario.rol === "FISCAL" ? generarNifFiscal(usuario.id) : null);

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
      console.warn("No se pudo resolver la foto del usuario:", error);
      fotoFinal = null;
    }

    const svg = buildCarnetSvg({
      nombreIC: usuario.nombreIC,
      rut: usuario.rut,
      cargo,
      nif,
      institucion,
      fotoDataUri: fotoFinal,
    });

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error generando carnet:", error);
    return NextResponse.json(
      { error: "No se pudo generar la identificación institucional" },
      { status: 500 }
    );
  }
}
