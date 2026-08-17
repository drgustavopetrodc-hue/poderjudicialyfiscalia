import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import Link from "next/link";

export default async function ParteDashboard() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string;
  const rol = (session?.user as any)?.rol ?? "CIUDADANO";

  const partesCausas = await prisma.parteCausa.findMany({
    where: { userId },
    include: { causa: true },
  });

  return (
    <DashboardShell rol={rol} titulo="Mis causas">
      {partesCausas.length === 0 ? (
        <p className="text-grafito/50">No figuras como parte en ninguna causa por ahora.</p>
      ) : (
        <div className="grid gap-3">
          {partesCausas.map((pc) => (
            <Link
              key={pc.id}
              href={`/causas/${pc.causaId}`}
              className="block bg-white border border-grafito/10 rounded-sm p-5 hover:border-dorado-500/40 transition-colors"
            >
              <p className="font-mono text-xs text-grafito/40">RIT {pc.causa.rit}</p>
              <h3 className="font-display text-lg">{pc.causa.caratulado}</h3>
              <p className="text-sm text-grafito/50">
                Tu calidad: {pc.rol} · Estado: {pc.causa.estado.replace(/_/g, " ")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
