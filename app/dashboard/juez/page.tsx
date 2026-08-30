import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import CredencialPreview from "@/components/CredencialPreview";
import Link from "next/link";


export const dynamic = "force-dynamic";
export default async function JuezDashboard() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string;
  const rol = (session?.user as any)?.rol as string;

  const [causas, usuarioActual] = await Promise.all([
    prisma.causa.findMany({
      where: { juezId: userId },
      orderBy: { actualizadaEn: "desc" },
      include: { fiscal: true, _count: { select: { audiencias: true, escritos: true } } },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, rol: true, nombreIC: true, rut: true } }),
  ]);

  return (
    <DashboardShell rol={rol} titulo="Causas asignadas a mi tribunal">
      {usuarioActual && <CredencialPreview usuario={usuarioActual} />}
      {causas.length === 0 ? (
        <p className="text-grafito/50">
          Aún no tienes causas asignadas. El fiscal a cargo o un administrador
          te asignará como juez de una causa cuando corresponda.
        </p>
      ) : (
        <div className="grid gap-3">
          {causas.map((c) => (
            <Link
              key={c.id}
              href={`/causas/${c.id}`}
              className="block panel-card p-5 hover:border-dorado-500/40 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-mono text-xs text-grafito/40">RIT {c.rit}</p>
                  <h3 className="font-display text-lg">{c.caratulado}</h3>
                  <p className="text-sm text-grafito/50">
                    Fiscal: {c.fiscal.name} · {c._count.audiencias} audiencia(s) ·{" "}
                    {c._count.escritos} escrito(s)
                  </p>
                </div>
                <span className="badge bg-marino-950 text-hueso">
                  {c.estado.replace(/_/g, " ")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
