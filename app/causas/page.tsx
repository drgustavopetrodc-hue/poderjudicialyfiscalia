import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import DashboardShell from "@/components/DashboardShell";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ROLES_CON_ACCESO = ["ADMIN", "JUEZ", "FISCAL", "ABOGADO"];

async function tomarCausaComoJuez(causaId: string) {
  "use server";
  const session = await getServerSession(authOptions);
  const juezId = (session?.user as any)?.id as string;
  const rol = (session?.user as any)?.rol;
  if (!juezId || (rol !== "JUEZ" && rol !== "ADMIN")) return;
  await prisma.causa.update({ where: { id: causaId }, data: { juezId } });
  revalidatePath("/causas");
}

async function asumirDefensaRapida(causaId: string) {
  "use server";
  const session = await getServerSession(authOptions);
  const abogadoId = (session?.user as any)?.id as string;
  const rol = (session?.user as any)?.rol;
  if (!abogadoId || (rol !== "ABOGADO" && rol !== "ADMIN")) return;
  if (rol !== "ADMIN") {
    const cert = await prisma.certificacionAbogado.findUnique({ where: { userId: abogadoId } });
    if (!cert || cert.estado !== "APROBADA") return;
  }
  await prisma.defensa.create({ data: { causaId, abogadoId } });
  revalidatePath("/causas");
}

const estadoVisual: Record<string, string> = {
  EN_INVESTIGACION: "En investigación",
  FORMALIZADA: "Formalizada",
  EN_JUICIO: "En juicio",
  SENTENCIADA: "Sentenciada",
  ARCHIVADA: "Archivada",
  SOBRESEIDA: "Sobreseída",
};

export default async function CausasPage() {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol as string | undefined;
  const userId = (session?.user as any)?.id as string | undefined;
  if (!rol || !ROLES_CON_ACCESO.includes(rol)) redirect("/dashboard?error=sin-permiso");

  const causas = await prisma.causa.findMany({
    orderBy: { creadaEn: "desc" },
    include: {
      fiscal: true,
      juez: true,
      defensas: { where: { activa: true }, include: { abogado: true } },
      escritos: { orderBy: { presentadoEn: "desc" }, take: 3, include: { autor: true } },
      audiencias: { orderBy: { fechaHora: "asc" }, take: 3 },
      sentencia: true,
      _count: { select: { audiencias: true, escritos: true, partes: true } },
    },
    take: 100,
  });
  const seleccionada = causas[0];

  return (
    <DashboardShell rol={rol} titulo="Mesa de causas">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Gestión de expedientes</p>
          <h2 className="font-display text-3xl text-marino-950">Todas las causas</h2>
          <p className="mt-1 text-sm text-grafito/55">Selecciona un expediente para consultar su estado y actividad.</p>
        </div>
        <div className="rounded-full border border-dorado-500/30 bg-dorado-400/10 px-4 py-2 font-mono text-xs text-marino-900">
          {causas.length} expedientes activos
        </div>
      </div>

      {seleccionada ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(260px,0.78fr)_minmax(0,1.55fr)]">
          <section className="min-w-0 rounded-2xl border border-grafito/10 bg-white p-3 shadow-[0_15px_45px_rgba(11,21,38,0.06)]">
            <div className="flex items-center justify-between px-3 pb-3 pt-2">
              <div>
                <p className="eyebrow">Expedientes</p>
                <p className="font-display text-xl text-marino-950">Bandeja judicial</p>
              </div>
              <span className="rounded-full bg-hueso px-2.5 py-1 font-mono text-[10px] text-grafito/55">100 máx.</span>
            </div>
            <div className="max-h-[calc(100vh-270px)] space-y-2 overflow-y-auto pr-1">
              {causas.map((c) => (
                <Link
                  key={c.id}
                  href={`/causas/${c.id}`}
                  className={`group block rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:border-dorado-500/60 hover:shadow-md ${
                    c.id === seleccionada.id ? "border-dorado-500/70 bg-marino-950 text-hueso shadow-lg" : "border-grafito/10 bg-hueso/35"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className={`font-mono text-[10px] uppercase tracking-wider ${c.id === seleccionada.id ? "text-dorado-300" : "text-grafito/45"}`}>RIT {c.rit}</span>
                    <span className={`h-2 w-2 rounded-full ${c.estado === "SENTENCIADA" ? "bg-dorado-400" : "bg-emerald-500"}`} />
                  </div>
                  <h3 className="line-clamp-2 font-display text-lg leading-tight">{c.caratulado}</h3>
                  <p className={`mt-2 text-xs ${c.id === seleccionada.id ? "text-hueso/60" : "text-grafito/50"}`}>{estadoVisual[c.estado]}</p>
                  <p className={`mt-3 font-mono text-[10px] ${c.id === seleccionada.id ? "text-hueso/45" : "text-grafito/40"}`}>
                    {c._count.escritos} escritos · {c._count.audiencias} audiencias
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <CausaPanel causa={seleccionada} rol={rol} userId={userId} tomarCausaComoJuez={tomarCausaComoJuez} asumirDefensaRapida={asumirDefensaRapida} />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-grafito/20 bg-white p-16 text-center">
          <p className="font-display text-2xl text-marino-950">No hay causas registradas</p>
          <p className="mt-2 text-sm text-grafito/50">Los nuevos expedientes aparecerán aquí.</p>
        </div>
      )}
    </DashboardShell>
  );
}

function CausaPanel({ causa, rol, userId, tomarCausaComoJuez, asumirDefensaRapida }: any) {
  const yoSoyDefensor = causa.defensas.some((d: any) => d.abogadoId === userId);
  const yoSoyElJuez = causa.juezId === userId;
  const puedeDefensa = (rol === "ABOGADO" || rol === "ADMIN") && !yoSoyDefensor;
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-grafito/10 bg-white shadow-[0_15px_45px_rgba(11,21,38,0.06)]">
      <div className="bg-marino-950 px-6 py-7 text-hueso sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-dorado-300">Expediente · RIT {causa.rit}</p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl leading-tight sm:text-4xl">{causa.caratulado}</h2>
          </div>
          <span className="rounded-full border border-dorado-300/40 bg-dorado-400/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-dorado-300">{estadoVisual[causa.estado]}</span>
        </div>
        <div className="mt-7 grid gap-4 border-t border-hueso/10 pt-5 text-sm sm:grid-cols-3">
          <div><p className="text-hueso/45">Fiscal</p><p className="mt-1">{causa.fiscal.name}</p></div>
          <div><p className="text-hueso/45">Juez</p><p className="mt-1">{causa.juez?.name ?? "Sin asignar"}</p></div>
          <div><p className="text-hueso/45">Partes / actividad</p><p className="mt-1">{causa._count.partes} partes · {causa._count.escritos} escritos</p></div>
        </div>
      </div>
      <div className="space-y-6 p-6 sm:p-8">
        <div>
          <p className="eyebrow">Resumen del caso</p>
          <p className="mt-2 text-sm font-medium text-marino-900">{causa.delito}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-grafito/65">{causa.descripcion}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-grafito/10 bg-hueso/45 p-4">
            <p className="eyebrow">Defensa técnica</p>
            <p className="mt-2 text-sm text-grafito/70">{causa.defensas.length ? causa.defensas.map((d: any) => d.abogado.name).join(", ") : "Sin abogado defensor"}</p>
            {puedeDefensa && <form action={asumirDefensaRapida.bind(null, causa.id)} className="mt-3"><button className="button-secondary">Asumir defensa</button></form>}
          </div>
          <div className="rounded-xl border border-grafito/10 bg-hueso/45 p-4">
            <p className="eyebrow">Agenda</p>
            <p className="mt-2 text-sm text-grafito/70">{causa._count.audiencias} audiencia(s) programada(s)</p>
            {causa.audiencias[0] && <p className="mt-2 text-xs text-grafito/50">{new Date(causa.audiencias[0].fechaHora).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" })}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-grafito/10 pt-5">
          {(rol === "JUEZ" || rol === "ADMIN") && !yoSoyElJuez && <form action={tomarCausaComoJuez.bind(null, causa.id)}><button className="button-primary">Tomar como juez</button></form>}
          <Link href={`/causas/${causa.id}`} className="button-outline">Abrir expediente completo →</Link>
        </div>
      </div>
    </section>
  );
}