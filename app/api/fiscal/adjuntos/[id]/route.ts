import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { puedeAccederCausa, contextoSesion } from "@/lib/autorizacion";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const rol = (session?.user as any)?.rol;
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const adjunto = await prisma.adjuntoFiscal.findUnique({
    where: { id },
    include: { causa: { select: { fiscalId: true, juezId: true } } },
  });
  if (!adjunto) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  const contexto = contextoSesion(session);
  const tieneAcceso = !!contexto && await puedeAccederCausa(adjunto.causaId, contexto);
  if (!tieneAcceso) return NextResponse.json({ error: "Sin permiso para este archivo" }, { status: 403 });

  return new NextResponse(Buffer.from(adjunto.datos), {
    headers: {
      "Content-Type": adjunto.mimeType,
      "Content-Length": String(adjunto.tamano),
      "Content-Disposition": `inline; filename="${encodeURIComponent(adjunto.nombre)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}