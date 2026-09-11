import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AntecedentesPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; rol?: string; name?: string | null; nombreIC?: string | null; rut?: string | null } | undefined;
  if (!user?.id || !user.rol) redirect("/login");

  const nombreConsultante = user.nombreIC?.trim() || user.name?.trim();
  const causas = await prisma.causa.findMany({
    where: nombreConsultante ? { imputado: { contains: nombreConsultante, mode: "insensitive" } } : { id: "__sin-imputado__" },
    select: { id: true, rit: true, caratulado: true, delito: true, estado: true, creadaEn: true },
    orderBy: { creadaEn: "desc" },
  });

  return (
    <DashboardShell rol={user.rol} titulo="Certificado de Antecedentes">
      <div className="mx-auto max-w-4xl">
        <div className="ojv-card">
          <div className="ojv-tabs"><Link href="/tramite-facil" className="ojv-tab">Trámite Fácil</Link><span className="ojv-tab ojv-tab-active">Certificado de Antecedentes</span></div>
          <div className="ojv-form">
            <h1 className="font-display text-2xl text-[#12486d]">Certificado de Antecedentes</h1>
            <p className="mt-2 text-sm text-grafito/60">El certificado se genera con la información judicial asociada a tu usuario en este sistema.</p>
            <div className="mt-5 border border-[#d3d9dc] bg-[#fafafa] p-4">
              <p className="ojv-label">Resultado de la consulta</p>
              <p className="mt-2 text-sm text-grafito/75">{causas.length ? `Se encontraron ${causas.length} causa(s) donde figuras como imputado.` : "No se encontraron antecedentes judiciales como imputado en el sistema."}</p>
            </div>
            {causas.length > 0 && <div className="mt-4 grid gap-2">{causas.map((causa) => <div key={causa.id} className="border border-[#d3d9dc] p-3 text-sm"><strong className="text-[#12486d]">RIT {causa.rit}</strong><span className="ml-2 text-grafito/65">{causa.caratulado} · {causa.delito} · {causa.estado}</span></div>)}</div>}
            <a href="/api/tramite-facil/antecedentes/pdf" className="ojv-search mt-5 inline-flex">Generar certificado PDF</a>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
