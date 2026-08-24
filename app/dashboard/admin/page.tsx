import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export const dynamic = "force-dynamic";
export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol ?? "ADMIN";
  const [totalCausas, totalUsuarios, certPendientes] = await Promise.all([
    prisma.causa.count(),
    prisma.user.count(),
    prisma.certificacionAbogado.count({ where: { estado: "PENDIENTE" } }),
  ]);

  return (
    <DashboardShell rol={rol} titulo="Panel general">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          ["Causas registradas", totalCausas],
          ["Usuarios", totalUsuarios],
          ["Certificaciones pendientes", certPendientes],
        ].map(([label, value]) => (
          <div key={label as string} className="panel-card p-6">
            <p className="text-sm text-grafito/50">{label}</p>
            <p className="font-display text-4xl mt-1">{value as number}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Link
          href="/dashboard/admin/usuarios"
          className="button-primary"
        >
          Gestionar usuarios y roles
        </Link>
        <Link
          href="/dashboard/admin/certificaciones"
          className="button-outline"
        >
          Revisar certificaciones
        </Link>
      </div>
    </DashboardShell>
  );
}
