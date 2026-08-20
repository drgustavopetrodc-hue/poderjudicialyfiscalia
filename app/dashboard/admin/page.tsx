import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import Link from "next/link";


export const dynamic = "force-dynamic";
export default async function AdminDashboard() {
  const [totalCausas, totalUsuarios, certPendientes] = await Promise.all([
    prisma.causa.count(),
    prisma.user.count(),
    prisma.certificacionAbogado.count({ where: { estado: "PENDIENTE" } }),
  ]);

  return (
    <DashboardShell rol="ADMIN" titulo="Panel general">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          ["Causas registradas", totalCausas],
          ["Usuarios", totalUsuarios],
          ["Certificaciones pendientes", certPendientes],
        ].map(([label, value]) => (
          <div key={label as string} className="bg-white border border-grafito/10 rounded-sm p-6">
            <p className="text-sm text-grafito/50">{label}</p>
            <p className="font-display text-4xl mt-1">{value as number}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Link
          href="/dashboard/admin/usuarios"
          className="bg-marino-950 text-hueso px-5 py-2.5 rounded-sm text-sm hover:bg-marino-900"
        >
          Gestionar usuarios y roles
        </Link>
        <Link
          href="/dashboard/admin/certificaciones"
          className="border border-grafito/20 px-5 py-2.5 rounded-sm text-sm hover:border-grafito/40"
        >
          Revisar certificaciones
        </Link>
      </div>
    </DashboardShell>
  );
}
