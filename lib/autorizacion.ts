import { prisma } from "@/lib/prisma";

export type ContextoSesion = { userId: string; rol: string };
export const esAdministracionSuperior = (rol: string | undefined) =>
  rol === "ADMIN" || rol === "PRESIDENTE_CORTE";

export function contextoSesion(session: any): ContextoSesion | null {
  const userId = session?.user?.id;
  const rol = session?.user?.rol;
  return typeof userId === "string" && typeof rol === "string" ? { userId, rol } : null;
}


export async function puedeAccederCausa(causaId: string, contexto: ContextoSesion) {
  if (esAdministracionSuperior(contexto.rol)) return true;

  const causa = await prisma.causa.findUnique({
    where: { id: causaId },
    select: {
      fiscalId: true,
      juezId: true,
      partes: { where: { userId: contexto.userId }, select: { id: true }, take: 1 },
      defensas: { where: { abogadoId: contexto.userId, activa: true }, select: { id: true }, take: 1 },
    },
  });
  if (!causa) return false;

  return (
    causa.fiscalId === contexto.userId ||
    causa.juezId === contexto.userId ||
    causa.partes.length > 0 ||
    causa.defensas.length > 0
  );
}