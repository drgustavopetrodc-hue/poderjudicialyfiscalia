import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";

export const dynamic = "force-dynamic";

export default async function MiFiscaliaEnLineaPage() {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol as string | undefined;

  if (!rol || !["ADMIN", "FUNCIONARIO"].includes(rol)) {
    redirect("/login");
  }

  return (
    <DashboardShell rol={rol} titulo="Mi Fiscalía en Línea">
      <div className="mx-auto max-w-4xl">
        <div className="panel-card p-6">
          <p className="eyebrow text-blue-700/80 mb-2">Acceso a servicios</p>
          <h2 className="font-display text-2xl text-grafito mb-2">Consulta de servicios en línea</h2>
          <p className="text-sm text-grafito/60 mb-5">
            Accede a los servicios disponibles para la gestión de casos y consultas.
          </p>
          <a href="/servicios" className="button-primary inline-flex">
            Ir a servicios en línea
          </a>
        </div>
      </div>
    </DashboardShell>
  );
}