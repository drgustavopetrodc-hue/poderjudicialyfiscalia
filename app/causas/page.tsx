import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import DashboardShell from "@/components/DashboardShell";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ROLES_CON_ACCESO = ["ADMIN", "JUEZ", "FISCAL", "ABOGADO"];

async function tomarCausaComoJuez(causaId: string) {
  "use server";
  const session = await getServerSession(authOptions);
  const juezId = (session?.user as any)?.id as string;
  const rol = (session?.user as any)?.rol;
  if (!juezId || rol !== "JUEZ") return;

  await prisma.causa.update({ where: { id: causaId }, data: { juezId } });
  revalidatePath("/causas");
}

async function asumirDefensaRapida(causaId: string) {
  "use server";
  const session = await getServerSession(authOptions);
  const abogadoId = (session?.user as any)?.id as string;
  const rol = (session?.user as any)?.rol;
  if (!abogadoId || rol !== "ABOGADO") return;

  const cert = await prisma.certificacionAbogado.findUnique({ where: { userId: abogadoId } });
  if (!cert || cert.estado !== "APROBADA") return;

  await prisma.defensa.create({ data: { causaId, abogadoId } });
  revalidatePath("/causas");
}

export default async function CausasPage() {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol as string | undefined;
  const userId = (session?.user as any)?.id as string | undefined;

  if (!rol || !ROLES_CON_ACCESO.includes(rol)) {
    redirect("/dashboard?error=sin-permiso");
  }

  const causas = await prisma.causa.findMany({
    orderBy: { creadaEn: "desc" },
    include: {
      fiscal: true,
      juez: true,
      defensas: { where: { activa: true }, include: { abogado: true } },
      _count: { select: { audiencias: true, escritos: true } },
    },
    take: 100,
  });

  return (
    <DashboardShell rol={rol} titulo="Todas las causas">
      <div className="grid gap-3">
        {causas.map((c) => {
          const yaTieneDefensor = c.defensas.length > 0;
          const yoSoyDefensor = c.defensas.some((d) => d.abogadoId === userId);
          const yoSoyElJuez = c.juezId === userId;

          return (
            <div
              key={c.id}
              className="bg-white border border-grafito/10 rounded-sm p-5 hover:border-dorado-500/40 transition-colors"
            >
              <div className="flex justify-between items-start gap-4">
                <Link href={`/causas/${c.id}`} className="flex-1">
                  <p className="font-mono text-xs text-grafito/40">RIT {c.rit}</p>
                  <h3 className="font-display text-lg">{c.caratulado}</h3>
                  <p className="text-sm text-grafito/50">
                    Fiscal: {c.fiscal.name} · Juez: {c.juez?.name ?? "Sin asignar"}
                    {yaTieneDefensor && ` · Defensa: ${c.defensas.map((d) => d.abogado.name).join(", ")}`}
                  </p>
                  <p className="text-xs text-grafito/40 mt-1">
                    {c._count.audiencias} audiencia(s) · {c._count.escritos} escrito(s)
                  </p>
                </Link>
                <span className="text-xs font-mono uppercase bg-marino-950 text-hueso px-2 py-1 rounded-sm shrink-0">
                  {c.estado.replace(/_/g, " ")}
                </span>
              </div>

              <div className="flex gap-2 mt-3 pt-3 border-t border-grafito/10">
                {rol === "JUEZ" && !yoSoyElJuez && (
                  <form action={tomarCausaComoJuez.bind(null, c.id)}>
                    <button className="text-sm bg-marino-950 text-hueso px-3 py-1.5 rounded-sm hover:bg-marino-900">
                      Tomar causa
                    </button>
                  </form>
                )}
                {rol === "ABOGADO" && !yoSoyDefensor && (
                  <form action={asumirDefensaRapida.bind(null, c.id)}>
                    <button className="text-sm bg-marino-950 text-hueso px-3 py-1.5 rounded-sm hover:bg-marino-900">
                      Asumir defensa
                    </button>
                  </form>
                )}
                <Link
                  href={`/causas/${c.id}`}
                  className="text-sm border border-grafito/20 px-3 py-1.5 rounded-sm hover:border-grafito/40"
                >
                  Ver expediente completo
                </Link>
              </div>
            </div>
          );
        })}
        {causas.length === 0 && <p className="text-grafito/50">Aún no hay causas registradas.</p>}
      </div>
    </DashboardShell>
  );
}
