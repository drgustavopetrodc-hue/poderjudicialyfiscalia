import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AbogadoDashboard() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string;
  const rol = (session?.user as any)?.rol as string;
  const esAdmin = rol === "ADMIN";

  const certificacion = await prisma.certificacionAbogado.findUnique({ where: { userId } });

  // Un ADMIN (Corte Suprema) ve todas las defensas activas del sistema,
  // no solo las suyas — sirve para supervisar y para pruebas.
  const defensas = await prisma.defensa.findMany({
    where: esAdmin ? { activa: true } : { abogadoId: userId, activa: true },
    include: { causa: true, abogado: true },
    orderBy: { asumidaEn: "desc" },
  });

  return (
    <DashboardShell rol={rol} titulo={esAdmin ? "Todas las defensas activas" : "Mis defensas activas"}>
      {!esAdmin && (!certificacion || certificacion.estado !== "APROBADA") ? (
        <div className="bg-dorado-400/10 border border-dorado-500/30 text-marino-900 rounded-sm p-5 mb-6">
          <p className="font-semibold mb-1">
            {certificacion ? `Certificación: ${certificacion.estado}` : "Aún no solicitas certificación"}
          </p>
          <p className="text-sm mb-3">
            Necesitas una certificación aprobada por el Poder Judicial para poder
            asumir defensas técnicas.
          </p>
          <Link href="/dashboard/abogado/certificacion" className="text-sm underline font-medium">
            Ir a certificación →
          </Link>
        </div>
      ) : null}

      {esAdmin && (
        <div className="flex gap-3 mb-6">
          <Link
            href="/dashboard/admin/certificaciones"
            className="text-sm bg-marino-950 text-hueso px-4 py-2 rounded-sm hover:bg-marino-900"
          >
            Revisar certificaciones pendientes
          </Link>
          <Link href="/abogados" className="text-sm border border-grafito/20 px-4 py-2 rounded-sm hover:border-grafito/40">
            Ver directorio de abogados
          </Link>
        </div>
      )}

      {defensas.length === 0 ? (
        <p className="text-grafito/50">
          {esAdmin ? "No hay defensas activas en el sistema todavía." : "No tienes defensas activas."}
        </p>
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
              <p className="text-sm text-grafito/50">
                {esAdmin && `Defensor: ${d.abogado.name} · `}
                Estado: {d.causa.estado.replace(/_/g, " ")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
