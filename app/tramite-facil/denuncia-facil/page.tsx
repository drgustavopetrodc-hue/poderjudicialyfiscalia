import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DenunciaFacilPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { rol?: string } | undefined;
  if (!user?.rol) redirect("/login");

  const puedeGestionar = user.rol === "FISCAL" || user.rol === "ADMIN";

  return (
    <DashboardShell rol={user.rol} titulo="Denuncia Fácil">
      <div className="mx-auto max-w-4xl">
        <section className="ojv-card">
          <div className="ojv-tabs">
            <Link href="/tramite-facil" className="ojv-tab">Trámite Fácil</Link>
            <span className="ojv-tab ojv-tab-active">Denuncia Fácil</span>
          </div>
          <div className="ojv-form">
            <h1 className="font-display text-2xl text-[#12486d]">Denuncia Fácil</h1>
            <p className="mt-2 text-sm text-grafito/60">Presenta una denuncia o accede a la bandeja de denuncias recibidas.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link href="/denuncias/nueva" className="ojv-card block p-5 transition hover:border-[#5b8038]">
                <p className="ojv-label">Para toda persona autenticada</p>
                <h2 className="mt-2 font-display text-xl text-[#12486d]">Presentar denuncia</h2>
                <p className="mt-2 text-sm text-grafito/60">Informa los datos de la víctima, victimario y lugar de los hechos.</p>
              </Link>
              {puedeGestionar && (
                <Link href="/denuncias" className="ojv-card block p-5 transition hover:border-[#5b8038]">
                  <p className="ojv-label">Acceso de Fiscalía</p>
                  <h2 className="mt-2 font-display text-xl text-[#12486d]">Gestionar denuncias</h2>
                  <p className="mt-2 text-sm text-grafito/60">Consulta todas las denuncias recibidas y decide si corresponde elevarlas a una causa.</p>
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
