import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import fs from "fs";
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

// ========================================================
// GENERACIÓN DE CREDENCIAL - SOLO FUENTES GENÉRICAS
// ========================================================

function drawRoundRect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function generarPlacaPng({
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
}): Promise<Buffer> {
  const width = 360;
  const height = 560;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const esFiscalia = rol === "FISCAL";
  const colorPrimario = esFiscalia ? "#0f2e5c" : "#0a192f";
  const colorSecundario = esFiscalia ? "#174785" : "#112240";
  const colorDetalle = esFiscalia ? "#79b2fc" : "#b3924b";
  const tituloEntidad = esFiscalia ? "MINISTERIO PUBLICO" : "PODER JUDICIAL";
  const subtituloEntidad = esFiscalia ? "FISCALIA DE CHILE" : "REPUBLICA DE CHILE";
  const siglasSello = esFiscalia ? "MP" : "PJUD";
  const colorTextoCargo = esFiscalia ? "#dc2626" : "#0a192f";
  const textoFooter = esFiscalia ? "DOCUMENTO INTERNO" : "MINISTERIO DE JUSTICIA";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, 0, 118);
  gradient.addColorStop(0, colorPrimario);
  gradient.addColorStop(1, colorSecundario);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, 118);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(tituloEntidad, width / 2, 38);

  ctx.fillStyle = colorDetalle;
  ctx.font = "bold 9px sans-serif";
  ctx.fillText(subtituloEntidad, width / 2, 56);

  ctx.beginPath();
  ctx.arc(width / 2, 94, 24, 0, Math.PI * 2);
  ctx.fillStyle = colorPrimario;
  ctx.fill();
  ctx.strokeStyle = colorDetalle;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = colorDetalle;
  ctx.font = "bold 11px sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(siglasSello, width / 2, 94);

  const boxX = 86;
  const boxY = 138;
  const boxW = 188;
  const boxH = 188;

  ctx.fillStyle = "#f3f4f6";
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = colorPrimario;
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  if (fotoDataUri) {
    try {
      const img = await loadImage(fotoDataUri);
      ctx.drawImage(img, boxX + 1, boxY + 1, boxW - 2, boxH - 2);
    } catch (e) {
      console.error(e);
    }
  } else {
    ctx.fillStyle = colorPrimario;
    ctx.font = "bold 42px sans-serif";
    ctx.fillText((nombreIC || "?").trim().slice(0, 2).toUpperCase(), width / 2, boxY + (boxH / 2));
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#6b7280";
  ctx.font = "bold 8px sans-serif";
  ctx.fillText("FUNCIONARIO / MAGISTRADO", 24, 344);
  ctx.fillStyle = "#111827";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText(nombreIC, 24, 364);

  ctx.fillStyle = "#6b7280";
  ctx.font = "bold 8px sans-serif";
  ctx.fillText("RUN / RUT NACIONAL", 24, 404);
  ctx.fillStyle = "#111827";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText(formatearRut(rut), 24, 424);

  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(246, 330, 82, 82);
  ctx.strokeRect(246, 330, 82, 82);

  ctx.fillStyle = "#111827";
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(252 + i * 18, 336, 10, 10);
    ctx.fillRect(252 + i * 18, 394, 10, 10);
  }

  ctx.fillRect(246, 422, 82, 28);
  ctx.strokeRect(246, 422, 82, 28);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(247, 423, 80, 26);
  ctx.fillStyle = "#111827";
  for (let i = 0; i < 20; i++) {
    const barWidth = i % 3 === 0 ? 3 : 1;
    ctx.fillRect(252 + i * 3.5, 426, barWidth, 20);
  }

  ctx.fillStyle = "#f9fafb";
  ctx.fillRect(22, 462, 316, 42);
  ctx.strokeStyle = "#e5e7eb";
  ctx.strokeRect(22, 462, 316, 42);
  
  ctx.fillStyle = colorDetalle;
  ctx.fillRect(22, 462, 4, 42);

  ctx.fillStyle = "#6b7280";
  ctx.font = "bold 8px sans-serif";
  ctx.fillText("CARGO INSTITUCIONAL", 34, 478);
  ctx.fillStyle = colorTextoCargo;
  ctx.font = "bold 13px sans-serif";
  ctx.fillText(cargo, 34, 496);

  ctx.fillStyle = colorPrimario;
  ctx.fillRect(0, 524, width, 36);

  ctx.fillStyle = colorDetalle;
  ctx.fillRect(0, 524, width, 2);

  ctx.fillStyle = "#ffffff";
  ctx.font = "11px monospace";
  ctx.fillText("|||| |||| ||||", 20, 546);

  ctx.textAlign = "right";
  ctx.font = "bold 8px sans-serif";
  ctx.fillText(textoFooter, width - 20, 546);

  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = "#ffffff";
  drawRoundRect(ctx, 0, 0, width, height, 16);
  ctx.fill();

  return canvas.toBuffer("image/png");
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

    const pngBuffer = await generarPlacaPng({
      nombreIC: usuario.nombreIC,
      rut: usuario.rut,
      cargo,
      rol: usuario.rol,
      fotoDataUri: fotoFinal,
    });

    const filename = `credencial_${usuario.nombreIC.toLowerCase().replace(/\s+/g, "_")}.png`;

    return new NextResponse(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error crítico en endpoint de carnet:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
