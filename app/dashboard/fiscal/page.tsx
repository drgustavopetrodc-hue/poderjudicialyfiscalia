import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { publicarCausaEnDiscord } from "@/lib/discordForum";
import SubirVideoFiscal from "@/components/SubirVideoFiscal";

export const dynamic = "force-dynamic";

const ESTADOS: Record<string, string> = {
  EN_INVESTIGACION: "En investigación", FORMALIZADA: "Formalizada", EN_JUICIO: "En juicio",
  EN_ESPERA_JUICIO: "En espera de juicio", EN_APELACION: "En apelación", SENTENCIADA: "Sentenciada",
  CERRADA: "Cerrada", ARCHIVADA: "Archivada", SOBRESEIDA: "Desestimada",
};

async function validarFiscalDeCausa(causaId: string) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const rol = (session?.user as any)?.rol;
  if (!userId || (rol !== "FISCAL" && rol !== "ADMIN")) return null;
  const causa = await prisma.causa.findFirst({ where: { id: causaId, ...(rol === "ADMIN" ? {} : { fiscalId: userId }) }, select: { id: true } });
  return causa ? { userId, rol } : null;
}

async function subirAdjunto(formData: FormData) {
  "use server";
  const causaId = String(formData.get("causaId"));
  const acceso = await validarFiscalDeCausa(causaId);
  if (!acceso) return;
  const tipo = String(formData.get("tipo"));
  const file = formData.get("archivo");
  if (!(file instanceof File) || file.size === 0 || file.size > 10 * 1024 * 1024) return;
  if (tipo !== "EVIDENCIA_VISUAL" && tipo !== "OFICIO") return;
  const permitido = tipo === "EVIDENCIA_VISUAL"
    ? file.type.startsWith("image/")
    : file.type === "application/pdf";
  if (!permitido) return;
  const bytes = Buffer.from(await file.arrayBuffer());
  await prisma.adjuntoFiscal.create({
    data: { causaId, subidoPorId: acceso.userId, tipo: tipo as any, nombre: file.name.slice(0, 180), mimeType: file.type, tamano: file.size, datos: bytes },
  });
  await publicarCausaEnDiscord(causaId, tipo === "OFICIO" ? "Nuevo oficio adjuntado" : "Nueva evidencia visual adjuntada");
  revalidatePath("/dashboard/fiscal");
  revalidatePath(`/causas/${causaId}`);
}

async function registrarTestimonio(formData: FormData) {
  "use server";
  const causaId = String(formData.get("causaId"));
  const acceso = await validarFiscalDeCausa(causaId);
  if (!acceso) return;
  const declarante = String(formData.get("declarante") ?? "").trim();
  const contenido = String(formData.get("contenido") ?? "").trim();
  if (!declarante || !contenido || contenido.length > 20000) return;
  await prisma.testimonio.create({ data: { causaId, registradoPorId: acceso.userId, declarante, contenido } });
  await publicarCausaEnDiscord(causaId, "Nuevo testimonio registrado");
  revalidatePath("/dashboard/fiscal");
  revalidatePath(`/causas/${causaId}`);
}

export default async function FiscalDashboard() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const rol = (session?.user as any)?.rol as string | undefined;
  if (!userId || !rol || (rol !== "FISCAL" && rol !== "ADMIN")) redirect("/dashboard?error=sin-permiso");

  const causas = await prisma.causa.findMany({
    where: { fiscalId: userId },
    orderBy: { actualizadaEn: "desc" },
    include: {
      juez: true,
      adjuntosFiscales: { orderBy: { creadoEn: "desc" }, take: 5 },
      testimonios: { orderBy: { creadoEn: "desc" }, take: 5 },
      _count: { select: { escritos: true, audiencias: true, ordenesCaptura: true, adjuntosFiscales: true, testimonios: true } },
    },
  });
  const activas = causas.filter((c) => !["CERRADA", "ARCHIVADA", "SENTENCIADA", "SOBRESEIDA"].includes(c.estado)).length;

  return (
    <DashboardShell rol={rol} titulo="Mi fiscalía">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Área de fiscalía</p><h2 className="font-display text-3xl text-marino-950">Causas a mi cargo</h2><p className="mt-1 text-sm text-grafito/55">Investiga, documenta y tramita cada expediente desde un solo lugar.</p></div>
        <Link href="/causas/nueva" className="button-primary">+ Registrar nueva causa</Link>
      </div>
      <div className="mb-7 grid gap-4 sm:grid-cols-3">
        <div className="stat-card"><p className="eyebrow">Total de causas</p><p className="mt-2 font-display text-3xl text-marino-950">{causas.length}</p></div>
        <div className="stat-card"><p className="eyebrow">En tramitación</p><p className="mt-2 font-display text-3xl text-blue-700">{activas}</p></div>
        <div className="stat-card"><p className="eyebrow">Material probatorio</p><p className="mt-2 font-display text-3xl text-indigo-700">{causas.reduce((total, c) => total + c._count.adjuntosFiscales + c._count.testimonios, 0)}</p></div>
      </div>

      <div className="grid gap-5">
        {causas.map((c) => (
          <section key={c.id} className="overflow-hidden rounded-2xl border border-grafito/10 bg-white shadow-[0_15px_35px_rgba(11,21,38,0.05)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-grafito/10 px-5 py-5">
              <Link href={`/causas/${c.id}`} className="min-w-[240px] flex-1">
                <p className="font-mono text-[10px] uppercase tracking-wider text-blue-600">RIT {c.rit}</p>
                <h3 className="mt-1 font-display text-2xl text-marino-950">{c.caratulado}</h3>
                <p className="mt-1 text-sm text-grafito/50">Juez: {c.juez?.name ?? "Sin asignar"} · {c._count.adjuntosFiscales} archivos · {c._count.testimonios} testimonios</p>
              </Link>
              <span className="rounded-full bg-blue-50 px-3 py-1.5 font-mono text-[10px] uppercase text-blue-700">{ESTADOS[c.estado] ?? c.estado.replace(/_/g, " ")}</span>
            </div>
            <div className="grid gap-5 p-5 lg:grid-cols-2">
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                <p className="eyebrow text-blue-700">Adjuntar antecedentes</p>
                <p className="mt-1 text-xs text-grafito/50">PDF para oficios o imágenes para evidencia visual. Máximo 10 MB.</p>
                <form action={subirAdjunto} className="mt-3 grid gap-2">
                  <input type="hidden" name="causaId" value={c.id} />
                  <select name="tipo" className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm"><option value="EVIDENCIA_VISUAL">Evidencia visual</option><option value="OFICIO">Oficio en PDF</option></select>
                  <input type="file" name="archivo" required accept="image/*,application/pdf" className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs" />
                  <button className="button-primary justify-self-start">Subir archivo</button>
                </form>

                <div className="mt-4 border-t border-blue-100 pt-3">
                  <p className="eyebrow text-blue-700 mb-2">Adjuntar video</p>
                  <SubirVideoFiscal causaId={c.id} />
                </div>

                {c.adjuntosFiscales.length > 0 && (
                  <div className="mt-4 space-y-1 border-t border-blue-100 pt-3">
                    {c.adjuntosFiscales.map((a) => (
                      <a key={a.id} href={`/api/fiscal/adjuntos/${a.id}`} target="_blank" className="block truncate text-xs text-blue-700 hover:underline">
                        ↗ {a.nombre} <span className="text-grafito/40">({a.tipo === "OFICIO" ? "oficio" : a.tipo === "VIDEO" ? "video" : "evidencia"})</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                <p className="eyebrow text-blue-700">Registrar testimonio</p>
                <p className="mt-1 text-xs text-grafito/50">Guarda declaraciones y antecedentes testimoniales dentro del expediente.</p>
                <form action={registrarTestimonio} className="mt-3 grid gap-2">
                  <input type="hidden" name="causaId" value={c.id} />
                  <input name="declarante" required placeholder="Nombre del declarante" className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm" />
                  <textarea name="contenido" required rows={3} placeholder="Relato del testimonio..." className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm" />
                  <button className="button-primary justify-self-start">Guardar testimonio</button>
                </form>
                {c.testimonios.length > 0 && <p className="mt-3 border-t border-blue-100 pt-3 text-xs text-grafito/50">{c.testimonios.length} testimonio(s) reciente(s) registrado(s).</p>}
              </div>
            </div>
          </section>
        ))}
        {!causas.length && <div className="rounded-2xl border border-dashed border-grafito/20 bg-white p-12 text-center"><p className="font-display text-2xl text-marino-950">Tu fiscalía está vacía</p><p className="mt-2 text-sm text-grafito/50">Registra tu primera causa para comenzar.</p><Link href="/causas/nueva" className="button-primary mt-5">Registrar causa</Link></div>}
      </div>
    </DashboardShell>
  );
}