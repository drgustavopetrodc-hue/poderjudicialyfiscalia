import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import Link from "next/link";

export default async function AbogadoDashboard() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string;

  const certificacion = await prisma.certificacionAbogado.findUnique({ where: { userId } });

  const defensas = await prisma.defensa.findMany({
    where: { abogadoId: userId, activa: true },
    include: { causa: true },
  });

  return (
    <DashboardShell rol="ABOGADO" titulo="Mis defensas activas">
      {!certificacion || certificacion.estado !== "APROBADA" ? (
        <div className="bg-dorado-400/10 border border-dorado-500/30 text-marino-900 rounded-sm p-5 mb-6">
          <p className="font-semibold mb-1">
            {certificacion ? `Certificación: ${certificacion.estado}` : "Aún no solicitas certificación"}
          </p>
          <p className="text-sm mb-3">
            Necesitas una certificación aprobada por el Poder Judicial para poder
            asumir defensas técnicas.
          </p>
          <Link
            href="/dashboard/abogado/certificacion"
            className="text-sm underline font-medium"
          >
            Ir a certificación →
          </Link>
        </div>
      ) : null}

      {defensas.length === 0 ? (
        <p className="text-grafito/50">No tienes defensas activas.</p>
      ) : (
        <div className="grid gap-3">
          {defensas.map((d) => (
            <Link
              key={d.id}
              href={`/causas/${d.causaId}`}
              className="block bg-white border border-grafito/10 rounded-sm p-5 hover:border-dorado-500/40 transition-colors"
            >
              <p className="font-mono text-xs text-grafito/40">RIT {d.causa.rit}</p>
              <h3 className="font-display text-lg">{d.causa.caratulado}</h3>
              <p className="text-sm text-grafito/50">Estado: {d.causa.estado.replace(/_/g, " ")}</p>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
