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
export const runtime = "nodejs";

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

function buildQrPattern(size = 21): { x: number; y: number; active: boolean }[] {
  const cells: { x: number; y: number; active: boolean }[] = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const finderA = x < 7 && y < 7;
      const finderB = x > 13 && y < 7;
      const finderC = x < 7 && y > 13;
      const isFinder = finderA || finderB || finderC;
      const seed = (x * 17 + y * 11) % 13;
      const active = isFinder ? true : seed % 3 === 0 || ((x + y) % 5 === 0 && x > 9 && y > 7);
      cells.push({ x, y, active });
    }
  }
  return cells;
}

function buildBarcodePattern(): boolean[] {
  const bars: boolean[] = [];
  for (let i = 0; i < 60; i += 1) {
    const active = i % 3 === 0 || (i % 7 === 0 && i > 10) || (i % 11 === 0 && i > 18) || (i % 5 === 0 && i < 8);
    bars.push(active);
  }
  return bars;
}

function buildCarnetSvg({
  nombreIC,
  rut,
  nif,
  cargo,
  institucion,
  fotoDataUri,
}: {
  nombreIC: string;
  rut: string;
  nif?: string | null;
  cargo: string;
  institucion: string;
  fotoDataUri?: string | null;
}): string {
  const nombre = escapeXml(nombreIC);
  const rutFormateado = escapeXml(formatearRut(rut));
  const cargoEscapado = escapeXml(cargo);
  const nifEscapado = nif ? escapeXml(nif) : "";
  const institucionEscapada = escapeXml(institucion);
  const initials = escapeXml((nombreIC || "?").trim().slice(0, 2).toUpperCase() || "MP");

  const avatarMarkup = fotoDataUri
    ? `<image href="${escapeXml(fotoDataUri)}" x="87" y="155" width="186" height="186" preserveAspectRatio="xMidYMid slice" />`
    : `<text x="180" y="258" text-anchor="middle" font-size="58" font-weight="800" fill="#0f2444">${initials}</text>`;

  const qrCells = buildQrPattern();
  const qrMarkup = qrCells
    .map((cell) => (cell.active ? `<rect x="${cell.x * 2 + 248}" y="${cell.y * 2 + 300}" width="2" height="2" fill="#111827" />` : ""))
    .join("");

  const barcode = buildBarcodePattern();
  const barcodeMarkup = barcode
    .map((active, idx) => (active ? `<rect x="${246 + idx * 1.35}" y="422" width="1.1" height="28" fill="#111827" />` : ""))
    .join("");

  return `
    <svg width="640" height="1000" viewBox="0 0 640 1000" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Credencial institucional">
      <defs>
        <linearGradient id="headerGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#0d2d4d" />
          <stop offset="100%" stop-color="#0d3d66" />
        </linearGradient>
      </defs>

      <rect width="640" height="1000" fill="#1f232b" />

      <g transform="translate(140 150)">
        <rect width="360" height="560" rx="16" fill="#edf2f5" stroke="#0f2444" stroke-width="2" />
        <rect x="0" y="0" width="360" height="118" rx="16" fill="url(#headerGradient)" />

        <text x="180" y="36" text-anchor="middle" font-size="22" font-weight="900" fill="#ffffff" letter-spacing="2">MINISTERIO PÚBLICO</text>
        <text x="180" y="58" text-anchor="middle" font-size="11" fill="#dfeaff" font-weight="700" letter-spacing="1">Ministerio Público</text>

        <circle cx="180" cy="100" r="38" fill="#dfefff" stroke="#ffffff" stroke-width="2" />
        <text x="180" y="110" text-anchor="middle" font-size="20" font-weight="900" fill="#0f2444">MP</text>

        <rect x="86" y="138" width="188" height="188" rx="8" fill="#dfe7f3" stroke="#0f2444" stroke-width="3" />
        ${avatarMarkup}

        <g>
          <text x="22" y="356" font-size="8" fill="#5d6b7a" font-weight="800" letter-spacing="1.8">NOMBRE FUNCIONARIO</text>
          <text x="22" y="382" font-size="20" fill="#0f2444" font-weight="800">${nombre}</text>

          <text x="22" y="432" font-size="8" fill="#5d6b7a" font-weight="800" letter-spacing="1.8">RUT INSTITUCIONAL</text>
          <text x="22" y="458" font-size="18" fill="#0f2444" font-weight="800">${rutFormateado}</text>
        </g>

        <g>
          <rect x="246" y="340" width="82" height="82" fill="#fff" stroke="#0f2444" stroke-width="2" />
          ${qrMarkup}

          <rect x="246" y="430" width="82" height="28" fill="#fff" stroke="#0f2444" stroke-width="1" />
          ${barcodeMarkup}
        </g>

        <rect x="22" y="476" width="316" height="42" fill="#dbe8f6" stroke="#0f2444" stroke-width="1.5" />
        <text x="34" y="494" font-size="10" fill="#5d6b7a" font-weight="700" letter-spacing="1.5">CARGO OFICIAL</text>
        <text x="34" y="516" font-size="16" fill="#0f2444" font-weight="800">${cargoEscapado}</text>

        <rect x="0" y="520" width="360" height="40" fill="#0f2444" />
        <text x="18" y="548" font-size="9" fill="#dfeaff" font-weight="700" letter-spacing="3">|||| |||| ||||</text>
        <text x="260" y="548" font-size="9" fill="#ffffff" font-weight="700" letter-spacing="2">DOCUMENTO INTERNO</text>
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
      nif,
      cargo,
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