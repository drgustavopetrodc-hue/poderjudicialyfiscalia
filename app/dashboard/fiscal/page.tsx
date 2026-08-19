import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import Link from "next/link";


export const dynamic = "force-dynamic";
export default async function FiscalDashboard() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string;
  const rol = (session?.user as any)?.rol as string;

  const causas = await prisma.causa.findMany({
    where: { fiscalId: userId },
    orderBy: { actualizadaEn: "desc" },
    include: { juez: true },
  });

  return (
    <DashboardShell rol={rol} titulo="Causas de mi fiscalía">
      <Link
        href="/causas/nueva"
        className="inline-block bg-marino-950 text-hueso px-5 py-2.5 rounded-sm text-sm mb-6 hover:bg-marino-900"
      >
        + Registrar nueva causa
      </Link>

      {causas.length === 0 ? (
        <p className="text-grafito/50">No has registrado causas todavía.</p>
      ) : (
        <div className="grid gap-3">
          {causas.map((c) => (
            <Link
              key={c.id}
              href={`/causas/${c.id}`}
              className="block bg-white border border-grafito/10 rounded-sm p-5 hover:border-dorado-500/40 transition-colors"
            >
              <p className="font-mono text-xs text-grafito/40">RIT {c.rit}</p>
              <h3 className="font-display text-lg">{c.caratulado}</h3>
              <p className="text-sm text-grafito/50">
                Juez: {c.juez?.name ?? "Sin asignar"} · Estado: {c.estado.replace(/_/g, " ")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
