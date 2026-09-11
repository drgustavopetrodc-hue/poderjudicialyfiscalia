import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  const publicacion = await prisma.publicacionTransparencia.findUnique({
    where: { id: params.id },
    select: { archivoDatos: true, archivoMimeType: true, archivoNombre: true },
  });
  if (!publicacion?.archivoDatos) return new NextResponse("Archivo no encontrado", { status: 404 });

  const nombre = (publicacion.archivoNombre || "adjunto-transparencia").replace(/[\\"\r\n]/g, "_");
  return new NextResponse(Buffer.from(publicacion.archivoDatos), {
    headers: {
      "Content-Type": publicacion.archivoMimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
