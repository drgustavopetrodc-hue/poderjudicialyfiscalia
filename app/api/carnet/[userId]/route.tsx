import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  ROLES_FUNCIONARIOS,
  INSTITUCION_POR_ROL,
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

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
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
  cargo,
  rol,
  fotoDataUri,
}: {
  nombreIC: string;
  rut: string;
  cargo: string;
  rol: string;
  fotoDataUri?: string | null;
}): string {
  const nombre = escapeXml(nombreIC);
  const rutFormateado = escapeXml(formatearRut(rut));
  const cargoEscapado = escapeXml(cargo);
  const initials = escapeXml((nombreIC || "?").trim().slice(0, 2).toUpperCase() || "PJ");

  const esFiscalia = rol === "FISCAL";
  const colorPrimario = esFiscalia ? "#0f2e5c" : "#0a192f";
  const colorSecundario = esFiscalia ? "#174785" : "#112240";
  const colorDetalle = esFiscalia ? "#79b2fc" : "#b3924b";
  const tituloEntidad = esFiscalia ? "MINISTERIO PÚBLICO" : "PODER JUDICIAL";
  const subtituloEntidad = esFiscalia ? "FISCALÍA DE CHILE" : "REPÚBLICA DE CHILE";
  const siglasSello = esFiscalia ? "MP" : "PJUD";
  const colorTextoCargo = esFiscalia ? "#dc2626" : "#0a192f";
  const textoFooter = esFiscalia ? "DOCUMENTO INTERNO" : "MINISTERIO DE JUSTICIA";

  const avatarMarkup = fotoDataUri
    ? `<image href="${escapeXml(fotoDataUri)}" x="88" y="140" width="184" height="184" preserveAspectRatio="xMidYMid slice" />`
    : `<text x="180" y="250" text-anchor="middle" font-size="52" font-weight="800" fill="${colorPrimario}">${initials}</text>`;

  // AJUSTE QR: Escala reducida a 1.75 y desfases X/Y recalculados para centrar perfectamente en la caja blanca
  const qrCells = buildQrPattern();
  const qrMarkup = qrCells
    .map((cell) => (cell.active ? `<rect x="${cell.x * 1.75 + 253}" y="${cell.y * 1.75 + 345}" width="1.8" height="1.8" fill="#111827" />` : ""))
    .join("");

  // AJUSTE BARRAS: Espaciador horizontal controlado para evitar desbordamientos en el extremo derecho
  const barcode = buildBarcodePattern();
  const barcodeMarkup = barcode
    .map((active, idx) => (active ? `<rect x="${251 + idx * 1.2}" y="435" width="1.0" height="20" fill="#111827" />` : ""))
    .join("");

  return `
    <svg width="640" height="1000" viewBox="0 0 640 1000" xmlns="http://w3.org" role="img" aria-label="Credencial institucional">
      <defs>
        <linearGradient id="headerGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="${colorPrimario}" />
          <stop offset="100%" stop-color="${colorSecundario}" />
        </linearGradient>
      </defs>

      <rect width="640" height="1000" fill="#1f232b" />

      <g transform="translate(140 150)">
        <rect width="360" height="560" rx="16" fill="#ffffff" stroke="${colorDetalle}" stroke-width="2" />
        <rect x="0" y="0" width="360" height="118" rx="16" fill="url(#headerGradient)" />

        <text x="180" y="38" text-anchor="middle" font-size="16" font-family="Arial, sans-serif" font-weight="900" fill="#ffffff" letter-spacing="1.5">${tituloEntidad}</text>
        <text x="180" y="56" text-anchor="middle" font-size="9" font-family="Arial, sans-serif" fill="${colorDetalle}" font-weight="700" letter-spacing="2">${subtituloEntidad}</text>

        <circle cx="180" cy="94" r="26" fill="${colorPrimario}" stroke="${colorDetalle}" stroke-width="2" />
        <text x="180" y="98" text-anchor="middle" font-size="11" font-family="Arial, sans-serif" font-weight="900" fill="${colorDetalle}">${siglasSello}</text>

        <rect x="86" y="138" width="188" height="188" rx="6" fill="#f3f4f6" stroke="${colorPrimario}" stroke-width="2" />
        ${avatarMarkup}

        <g font-family="Arial, sans-serif">
          <text x="24" y="356" font-size="8" fill="#6b7280" font-weight="700" letter-spacing="1">FUNCIONARIO / MAGISTRADO</text>
          <text x="24" y="378" font-size="15" fill="#111827" font-weight="800">${nombre}</text>

          <text x="24" y="416" font-size="8" fill="#6b7280" font-weight="700" letter-spacing="1">RUN / RUT NACIONAL</text>
          <text x="24" y="438" font-size="15" fill="#111827" font-weight="800">${rutFormateado}</text>
        </g>

        <g>
          <rect x="246" y="340" width="82" height="82" fill="#ffffff" stroke="#e5e7eb" stroke-width="1" />
          ${qrMarkup}

          <rect x="246" y="430" width="82" height="28" fill="#ffffff" stroke="#e5e7eb" stroke-width="1" />
          ${barcodeMarkup}
        </g>

        <rect x="22" y="468" width="316" height="42" fill="#f9fafb" stroke="#e5e7eb" stroke-width="1" />
        <line x1="22" y1="468" x2="22" y2="510" stroke="${colorDetalle}" stroke-width="4" />
        
        <text x="34" y="484" font-family="Arial, sans-serif" font-size="8" fill="#6b7280" font-weight="700" letter-spacing="1">CARGO INSTITUCIONAL</text>
        <text x="34" y="504" font-family="Arial, sans-serif" font-size="14" fill="${colorTextoCargo}" font-weight="900">${cargoEscapado}</text>

        <rect x="0" y="524" width="360" height="36" fill="${colorPrimario}" rx="0" />
        <line x1="0" y1="524" x2="360" y2="524" stroke="${colorDetalle}" stroke-width="2" />
        <text x="20" y="546" font-family="monospace" font-size="8" fill="#ffffff" letter-spacing="4">|||| |||| ||||</text>
        <text x="340" y="546" text-anchor="end" font-family="Arial, sans-serif" font-size="8" fill="#ffffff" font-weight="700" letter-spacing="1">${textoFooter}</text>
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
      console.warn("No se pudo resolver la foto del usuario:", error);
      fotoFinal = null;
    }

    const svg = buildCarnetSvg({
      nombreIC: usuario.nombreIC,
      rut: usuario.rut,
      cargo,
      rol: usuario.rol,
      fotoDataUri: fotoFinal,
    });

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error crítico en endpoint de carnet:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
