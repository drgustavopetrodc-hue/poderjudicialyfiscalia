import { prisma } from "@/lib/prisma";

type AudienciaParaNotificar = {
  id: string;
  causaId: string;
  fechaHora: Date;
  sala: string | null;
};

export async function notificarAudiencia(audiencia: AudienciaParaNotificar) {
  const causa = await prisma.causa.findUnique({
    where: { id: audiencia.causaId },
    select: {
      rit: true,
      tribunal: true,
      partes: { select: { userId: true } },
      defensas: { where: { activa: true }, select: { abogadoId: true } },
    },
  });
  if (!causa) return;

  const destinatarios = new Set([
    ...causa.partes.map((parte) => parte.userId),
    ...causa.defensas.map((defensa) => defensa.abogadoId),
  ]);
  if (!destinatarios.size) return;

  const fecha = audiencia.fechaHora.toLocaleDateString("es-CL");
  const hora = audiencia.fechaHora.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  const tribunal = causa.tribunal || "el tribunal correspondiente";
  const sala = audiencia.sala ? ` Sala: ${audiencia.sala}.` : "";

  await prisma.notificacion.createMany({
    data: [...destinatarios].map((userId) => ({
      userId,
      causaId: audiencia.causaId,
      audienciaId: audiencia.id,
      tipo: "AUDIENCIA_PROGRAMADA",
      titulo: "Citación a audiencia",
      mensaje: `Te han citado a una audiencia en el RIT ${causa.rit} con ${tribunal} a las ${hora} del ${fecha}.${sala}`,
    })),
    skipDuplicates: true,
  });
}