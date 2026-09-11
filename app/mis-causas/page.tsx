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
        <section className="ojv-card">
          <nav className="ojv-tabs" aria-label="Mis causas">
            <Link
              href="/mis-causas"
              className="ojv-tab ojv-tab-active"
            >
              Causas a mi Cargo
            </Link>

            {esFiscal && (
              <Link
                href="/causas/nueva"
                className="ojv-tab"
              >
                Crear causa
              </Link>
            )}
          </nav>

          <div className="ojv-form">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow mb-2 text-blue-700/80">Gestión de expedientes</p>
                <h1 className="font-display text-2xl text-[#12486d]">Causas a mi Cargo</h1>
                <p className="mt-1 text-sm text-grafito/55">
                  Consulta las causas asignadas a tu usuario.
                </p>
              </div>
              <span className="border border-[#d3d9dc] bg-[#fafafa] px-3 py-2 font-mono text-xs text-[#4b5563]">
                {causas.length} {causas.length === 1 ? "causa" : "causas"}
              </span>
            </div>

            {causas.length > 0 ? (
              <div className="grid gap-2">
                {causas.map((causa) => (
                  <Link
                    key={causa.id}
                    href={`/causas/${causa.id}`}
                    className="group border border-[#d3d9dc] bg-[#fafafa] p-4 transition hover:border-[#5b8038] hover:bg-white"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs uppercase tracking-wider text-[#66813d]">
                          RIT {causa.rit}
                        </p>
                        <h2 className="mt-1 font-display text-lg text-[#12486d] group-hover:text-[#5b8038]">
                          {causa.caratulado}
                        </h2>
                      </div>
                      <span className={`badge ${ESTILO_ESTADO_CAUSA[causa.estado] ?? "bg-grafito/20"}`}>
                        {etiquetaEstado(causa.estado)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-grafito/50">
                      {causa.tribunal ?? "Tribunal sin asignar"} · Actualizada {causa.actualizadaEn.toLocaleDateString("es-CL")}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-[#d3d9dc] bg-[#fafafa] p-10 text-center">
                <p className="font-display text-2xl text-[#12486d]">No hay causas asignadas</p>
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
