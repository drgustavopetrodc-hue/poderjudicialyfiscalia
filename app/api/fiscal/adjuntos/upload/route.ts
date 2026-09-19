import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { esFiscalRegional } from "@/lib/identidad";

export const dynamic = "force-dynamic";

/**
 * Este endpoint NO recibe el video en sí (eso evitaría el límite de tamaño de
 * las funciones serverless de Vercel). Solo autoriza la subida: el navegador
 * sube el archivo directo a Vercel Blob, y cuando termina, Vercel llama de
 * vuelta a este mismo endpoint para avisar que ya está listo.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id as string | undefined;
        const rol = (session?.user as any)?.rol as string | undefined;
        const esRegional = rol === "FISCAL" && esFiscalRegional((session?.user as any)?.discordId);
        if (!userId || (rol !== "FISCAL" && rol !== "ADMIN")) {
          throw new Error("No autorizado para subir videos.");
        }

        const payload = clientPayload ? JSON.parse(clientPayload) : {};
        const causaId = payload.causaId as string | undefined;
        if (!causaId) throw new Error("Falta indicar a qué causa pertenece el video.");

        const causa = await prisma.causa.findFirst({
          where: {
            id: causaId,
            ...(rol === "ADMIN" || esRegional ? {} : { OR: [{ fiscalId: userId }, { fiscalAuxiliarId: userId }] }),
          },
          select: { id: true },
        });
        if (!causa) throw new Error("No tienes acceso a esta causa.");

        return {
          allowedContentTypes: ["video/mp4", "video/webm", "video/quicktime"],
          maximumSizeInBytes: Number(process.env.VIDEO_MAX_SIZE_GB ?? 5) * 1024 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId, causaId }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = tokenPayload ? JSON.parse(tokenPayload) : {};
        if (!payload.causaId || !payload.userId) return;

        await prisma.adjuntoFiscal.create({
          data: {
            causaId: payload.causaId,
            subidoPorId: payload.userId,
            tipo: "VIDEO",
            nombre: blob.pathname.slice(0, 180),
            mimeType: blob.contentType ?? "video/mp4",
            url: blob.url,
          },
        });
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
