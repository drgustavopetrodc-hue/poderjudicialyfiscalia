import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import DashboardShell from "@/components/DashboardShell";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ESTILO_ESTADO_CAUSA, etiquetaEstado } from "@/lib/estilos";

export const dynamic = "force-dynamic";

const ROLES_CON_ACCESO = [
  "ADMIN",
  "CIUDADANO",
  "JUEZ",
  "FISCAL",
  "ABOGADO",
  "FUNCIONARIO",
];

export default async function MisCausasPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; rol?: string } | undefined;
  const userId = user?.id;
  const rol = user?.rol;

  if (!userId || !rol || !ROLES_CON_ACCESO.includes(rol)) {
    redirect("/login");
  }

  const where =
    rol === "ADMIN"
      ? undefined
      : rol === "FISCAL"
        ? { OR: [{ fiscalId: userId }, { fiscalAuxiliarId: userId }] }
        : rol === "JUEZ"
          ? { juezId: userId }
          : rol === "ABOGADO"
            ? { defensas: { some: { abogadoId: userId, activa: true } } }
            : rol === "CIUDADANO"
              ? { partes: { some: { userId } } }
              : { id: "__sin-causas-asignadas__" };

  const causas = await prisma.causa.findMany({
    where,
    orderBy: { actualizadaEn: "desc" },
    take: 100,
    select: {
      id: true,
      rit: true,
      caratulado: true,
      estado: true,
      tribunal: true,
      actualizadaEn: true,
    },
  });

  const esFiscal = rol === "FISCAL";

  return (
    <DashboardShell rol={rol} titulo="Mis causas">
      <div className="mx-auto max-w-6xl">
        <section className="overflow-hidden rounded-2xl border border-[#dfe6ed] bg-white shadow-sm">
          <nav className="flex border-b border-[#dfe6ed] bg-[#f4f7f9]" aria-label="Mis causas">
            <Link
              href="/mis-causas"
              className="border-b-2 border-[#527f2d] bg-[#527f2d] px-5 py-3 text-sm font-semibold text-white"
            >
              Causas a mi Cargo
            </Link>

            {esFiscal && (
              <Link
                href="/causas/nueva"
                className="px-5 py-3 text-sm font-medium text-[#0d2436] transition hover:bg-white"
              >
                Crear causa
              </Link>
            )}
          </nav>

          <div className="p-6">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow mb-2 text-blue-700/80">Gestión de expedientes</p>
                <h1 className="font-display text-3xl text-marino-950">Causas a mi Cargo</h1>
                <p className="mt-1 text-sm text-grafito/55">
                  Consulta las causas asignadas a tu usuario.
                </p>
              </div>
              <span className="rounded-full border border-dorado-500/30 bg-dorado-400/10 px-4 py-2 font-mono text-xs text-marino-900">
                {causas.length} {causas.length === 1 ? "causa" : "causas"}
              </span>
            </div>

            {causas.length > 0 ? (
              <div className="grid gap-3">
                {causas.map((causa) => (
                  <Link
                    key={causa.id}
                    href={`/causas/${causa.id}`}
                    className="group rounded-xl border border-grafito/10 bg-hueso/35 p-5 transition hover:-translate-y-0.5 hover:border-dorado-500/60 hover:bg-white hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs uppercase tracking-wider text-blue-600">
                          RIT {causa.rit}
                        </p>
                        <h2 className="mt-1 font-display text-xl text-marino-950 group-hover:text-blue-800">
                          {causa.caratulado}
                        </h2>
                      </div>
                      <span className={`badge ${ESTILO_ESTADO_CAUSA[causa.estado] ?? "bg-grafito/20"}`}>
                        {etiquetaEstado(causa.estado)}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-grafito/50">
                      {causa.tribunal ?? "Tribunal sin asignar"} · Actualizada {causa.actualizadaEn.toLocaleDateString("es-CL")}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-grafito/20 bg-hueso/35 p-12 text-center">
                <p className="font-display text-2xl text-marino-950">No hay causas asignadas</p>
                <p className="mt-2 text-sm text-grafito/55">
                  Las causas asociadas a tu usuario aparecerán en esta sección.
                </p>
                {esFiscal && (
                  <Link href="/causas/nueva" className="button-primary mt-5 inline-flex">
                    Crear causa
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
