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
      const inFinderA = x < 7 && y < 7;
      const inFinderB = x > 13 && y < 7;
      const inFinderC = x < 7 && y > 13;
      const isFinder = inFinderA || inFinderB || inFinderC;
      const seed = (x * 17 + y * 11) % 13;
      const active = isFinder ? true : seed % 3 === 0 || ((x + y) % 5 === 0 && x > 9 && y > 7);
      cells.push({ x, y, active });
    }
  }

  return cells;
}

function buildBarcodePattern(): boolean[] {
  const bars: boolean[] = [];
  for (let i = 0; i < 40; i += 1) {
    const active = i % 2 === 0 || (i % 7 === 0 && i > 10) || (i % 11 === 0 && i > 18);
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
  const qr = buildQrPattern();
  const barcode = buildBarcodePattern();
  const initials = escapeXml((nombreIC || "?").trim().slice(0, 2).toUpperCase() || "MP");

  const avatarMarkup = fotoDataUri
    ? `<image href="${escapeXml(fotoDataUri)}" x="32" y="70" width="188" height="188" preserveAspectRatio="xMidYMid slice" />`
    : `<text x="126" y="185" font-size="56" font-weight="800" text-anchor="middle" fill="#0f2444">${initials}</text>`;

  const qrMarkup = qr
    .map((cell) =>
      cell.active
        ? `<rect x="${cell.x * 2 + 2}" y="${cell.y * 2 + 2}" width="2" height="2" fill="#111827" />`
        : ""
    )
    .join("");

  const barcodeMarkup = barcode
    .map((active, idx) =>
      active
        ? `<rect x="${idx * 2}" y="0" width="1.5" height="24" fill="#111827" />`
        : ""
    )
    .join("");

  return `
    <svg width="640" height="1000" viewBox="0 0 640 1000" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Credencial institucional">
      <rect width="640" height="1000" fill="#1e242b" />
      <g transform="translate(140 180)">
        <rect width="360" height="560" rx="14" fill="#edf2f5" stroke="#0f2444" stroke-width="2"/>

        <rect x="0" y="0" width="360" height="120" fill="url(#headerGradient)" rx="14"/>
        <defs>
          <linearGradient id="headerGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#0d2d4d" />
            <stop offset="100%" stop-color="#0d3d66" />
          </linearGradient>
        </defs>

        <text x="180" y="36" text-anchor="middle" font-size="22" font-weight="900" fill="#ffffff" letter-spacing="2">MINISTERIO PÚBLICO</text>
        <text x="180" y="60" text-anchor="middle" font-size="11" font-weight="700" fill="#dfeaff" letter-spacing="1">${institucionEscapada}</text>

        <circle cx="180" cy="110" r="36" fill="#dfefff" stroke="#ffffff" stroke-width="2" />
        <text x="180" y="120" text-anchor="middle" font-size="20" font-weight="900" fill="#0f2444">MP</text>

        <rect x="86" y="146" width="188" height="188" rx="8" fill="#dfe7f3" stroke="#0f2444" stroke-width="3" />
        ${avatarMarkup}

        <g transform="translate(20 344)">
          <text x="0" y="0" font-size="9" fill="#5d6b7a" font-weight="800" letter-spacing="1.8">NOMBRE FUNCIONARIO</text>
          <text x="0" y="26" font-size="20" fill="#0f2444" font-weight="800">${nombre}</text>

          <text x="0" y="72" font-size="9" fill="#5d6b7a" font-weight="800" letter-spacing="1.8">RUT INSTITUCIONAL</text>
          <text x="0" y="98" font-size="18" fill="#0f2444" font-weight="800">${rutFormateado}</text>

          ${nif ? `<text x="0" y="142" font-size="9" fill="#5d6b7a" font-weight="800" letter-spacing="1.8">NIF</text>
          <text x="0" y="166" font-size="16" fill="#0f2444" font-weight="800">${nifEscapado}</text>` : ""}
        </g>

        <g transform="translate(242 320)">
          <rect x="0" y="0" width="80" height="80" fill="#fff" stroke="#0f2444" stroke-width="2"/>
          <g transform="translate(8 8)">
            ${qrMarkup}
          </g>

          <rect x="0" y="92" width="80" height="26" fill="#fff" stroke="#0f2444" stroke-width="1"/>
          <g transform="translate(4 97)">
            ${barcodeMarkup}
          </g>
        </g>

        <rect x="0" y="520" width="360" height="40" fill="#0f2444"/>
        <text x="18" y="546" font-size="9" fill="#dfeaff" font-weight="700" letter-spacing="3">|||| |||| ||||</text>
        <text x="260" y="546" font-size="9" fill="#ffffff" font-weight="700" letter-spacing="2">DOCUMENTO INTERNO</text>

        <rect x="22" y="474" width="316" height="44" fill="#dbe8f6" stroke="#0f2444" stroke-width="1.5"/>
        <text x="34" y="498" font-size="10" fill="#5d6b7a" font-weight="700" letter-spacing="1.5">CARGO OFICIAL</text>
        <text x="34" y="520" font-size="16" fill="#0f2444" font-weight="800">${cargoEscapado}</text>
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

    const qrCells = Array.from({ length: 21 }, (_, y) =>
      Array.from({ length: 21 }, (_, x) => {
        const finderA = x < 7 && y < 7;
        const finderB = x > 13 && y < 7;
        const finderC = x < 7 && y > 13;
        const isFinder = finderA || finderB || finderC;
        const seed = (x * 17 + y * 11 + usuario.id.length * 3) % 13;
        const bit = isFinder ? true : (seed % 3 === 0 || ((x + y) % 5 === 0 && x > 9 && y > 7));
        return { x, y, bit };
      })
    ).flat();

    const barcodeBlocks = Array.from({ length: 40 }, (_, i) => {
      const active = i % 2 === 0 || (i % 7 === 0 && i > 10) || (i % 11 === 0 && i > 18);
      return { i, active };
    });

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