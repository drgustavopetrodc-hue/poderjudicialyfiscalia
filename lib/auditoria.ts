import { prisma } from "@/lib/prisma";

export async function registrarAuditoria({
  actorId,
  accion,
  entidad,
  entidadId,
  detalle,
}: {
  actorId?: string | null;
  accion: string;
  entidad: string;
  entidadId?: string | null;
  detalle?: string | null;
}) {
  await prisma.auditoria.create({
    data: { actorId: actorId || null, accion, entidad, entidadId: entidadId || null, detalle: detalle || null },
  });
}
