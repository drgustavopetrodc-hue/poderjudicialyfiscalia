import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import DashboardShell from "@/components/DashboardShell";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AbogadosPage() {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol as string | undefined;
  if (!session || !rol) redirect("/login");

  const certificados = await prisma.certificacionAbogado.findMany({
    where: { estado: "APROBADA" },
    include: { user: true },
    orderBy: { revisadoEn: "desc" },
  });

  return (
    <DashboardShell rol={rol} titulo="Abogados certificados">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Registro público</p>
            <h2 className="font-display text-3xl text-marino-950">Abogados certificados</h2>
            <p className="mt-1 text-sm text-grafito/55">Nómina de profesionales habilitados para ejercer la defensa técnica.</p>
          </div>
          <Link href="/dashboard" className="button-outline">← Volver al panel general</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {certificados.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-4 rounded-2xl border border-grafito/10 bg-white p-5 shadow-[0_15px_35px_rgba(11,21,38,0.05)]">
              <div>
                <p className="eyebrow text-blue-700">Defensa técnica habilitada</p>
                <h3 className="mt-2 font-display text-xl text-marino-950">{c.user.name}</h3>
                <p className="mt-1 text-sm text-grafito/50">Matrícula <span className="font-mono">{c.numeroMatricula}</span></p>
                {c.revisadoEn && <p className="mt-1 text-xs text-grafito/40">Certificado el {format(c.revisadoEn, "dd/MM/yyyy")}</p>}
              </div>
              <a href={`/api/certificados/${c.user.id}`} className="button-primary shrink-0" target="_blank">Descargar</a>
            </div>
          ))}
        </div>
        {certificados.length === 0 && <div className="rounded-2xl border border-dashed border-grafito/20 bg-white p-12 text-center text-sm text-grafito/50">Aún no hay abogados certificados.</div>}
      </div>
    </DashboardShell>
  );
}