import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import Link from "next/link";



export default async function IngresoCausasPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/ingreso-causas/acceso");
  const rol = (session.user as { rol?: string }).rol;
  if (!rol) redirect("/ingreso-causas/acceso");
  return (
    <DashboardShell rol={rol} titulo="Ingreso de causas y escritos">
      <div className="mx-auto max-w-5xl">
        <section className="ojv-card">
          <div className="ojv-tabs"><span className="ojv-tab ojv-tab-active">Ingreso de causas y escritos</span></div>
          <div className="ojv-form">
            <p className="eyebrow">Mesa de partes virtual</p>
            <h1 className="mt-1 font-display text-2xl text-[#12486d]">¿Qué deseas ingresar?</h1>
            <p className="mt-2 text-sm text-grafito/60">Selecciona el tipo de presentación y completa los antecedentes solicitados.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Link href="/ingreso-causas/demanda" className="ojv-card block p-5 transition hover:border-[#5b8038]">
                <p className="ojv-label">Nueva presentación</p>
                <h2 className="mt-2 font-display text-xl text-[#12486d]">Ingresar demanda</h2>
                <p className="mt-2 text-sm text-grafito/60">Registra tribunal, partes, hechos, fundamentos, peticiones y documentos.</p>
              </Link>
              <Link href="/escritos" className="ojv-card block p-5 transition hover:border-[#5b8038]">
                <p className="ojv-label">Actuación en una causa</p>
                <h2 className="mt-2 font-display text-xl text-[#12486d]">Ingresar escrito</h2>
                <p className="mt-2 text-sm text-grafito/60">Presenta un escrito asociado a una causa existente.</p>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
