import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const rol = (session?.user as any)?.rol;
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const adjunto = await prisma.adjuntoFiscal.findUnique({
    where: { id: params.id },
    include: { causa: { select: { fiscalId: true, juezId: true } } },
  });
  if (!adjunto) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  const tieneAcceso = rol === "ADMIN" || adjunto.causa.fiscalId === userId || adjunto.causa.juezId === userId;
  if (!tieneAcceso) return NextResponse.json({ error: "Sin permiso para este archivo" }, { status: 403 });

  // Los videos se sirven directo desde Vercel Blob (no viven en la base de datos).
  if (adjunto.url) {
    return NextResponse.redirect(adjunto.url);
  }
  if (!adjunto.datos) {
    return NextResponse.json({ error: "Este archivo no tiene contenido disponible" }, { status: 404 });
  }

  return new NextResponse(Buffer.from(adjunto.datos), {
    headers: {
      "Content-Type": adjunto.mimeType,
      "Content-Length": String(adjunto.tamano),
      "Content-Disposition": `inline; filename="${encodeURIComponent(adjunto.nombre)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}