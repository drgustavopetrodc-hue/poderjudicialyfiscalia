import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import MiFiscaliaShell from "@/components/MiFiscaliaShell";
import { esFiscalRegional } from "@/lib/identidad";

export const dynamic = "force-dynamic";

async function accesoFiscal() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const rol = (session?.user as any)?.rol as string | undefined;
  const esRegional = rol === "FISCAL" && esFiscalRegional((session?.user as any)?.discordId);
  if (!userId || (rol !== "FISCAL" && rol !== "ADMIN")) redirect("/dashboard?error=sin-permiso");
  return { userId, rol, esRegional };
}

async function agregarPrueba(formData: FormData) {
  "use server";
  const acceso = await accesoFiscal();
  const causaId = String(formData.get("causaId") ?? "");
  const tipo = String(formData.get("tipo") ?? "EVIDENCIA_VISUAL");
  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || !archivo.size || archivo.size > 10 * 1024 * 1024) return;
  if (tipo !== "EVIDENCIA_VISUAL" && tipo !== "OFICIO") return;
  if (tipo === "OFICIO" && archivo.type !== "application/pdf") return;
  if (tipo === "EVIDENCIA_VISUAL" && !archivo.type.startsWith("image/")) return;

  const causa = await prisma.causa.findFirst({
    where: { id: causaId, ...(acceso.rol === "ADMIN" || acceso.esRegional ? {} : { OR: [{ fiscalId: acceso.userId }, { fiscalAuxiliarId: acceso.userId }] }) },
    select: { id: true },
  });
  if (!causa) return;
  await prisma.adjuntoFiscal.create({
    data: { causaId, subidoPorId: acceso.userId, tipo: tipo as "EVIDENCIA_VISUAL" | "OFICIO", nombre: archivo.name.slice(0, 180), mimeType: archivo.type, tamano: archivo.size, datos: Buffer.from(await archivo.arrayBuffer()) },
  });
  redirect("/mi-fiscalia?guardado=prueba");
}

async function guardarEscrito(formData: FormData) {
  "use server";
  const acceso = await accesoFiscal();
  const causaId = String(formData.get("causaId") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const contenido = String(formData.get("contenido") ?? "").trim();
  const tipo = String(formData.get("tipoEscrito") ?? "OTRO");
  if (!titulo || !contenido || contenido.length > 50000) return;
  const causa = await prisma.causa.findFirst({
    where: { id: causaId, ...(acceso.rol === "ADMIN" || acceso.esRegional ? {} : { OR: [{ fiscalId: acceso.userId }, { fiscalAuxiliarId: acceso.userId }] }) },
    select: { id: true },
  });
  if (!causa) return;
  await prisma.escrito.create({ data: { causaId, autorId: acceso.userId, tipo: tipo as "QUERELLA" | "FORMALIZACION" | "ACUSACION" | "CONTESTACION" | "PRUEBA" | "RECURSO" | "OTRO", titulo, contenido } });
  redirect("/mi-fiscalia?guardado=escrito");
}

export default async function MiFiscaliaPage({ searchParams }: { searchParams?: { guardado?: string } }) {
  const acceso = await accesoFiscal();
  const causas = await prisma.causa.findMany({
    where: acceso.rol === "ADMIN" || acceso.esRegional ? undefined : { OR: [{ fiscalId: acceso.userId }, { fiscalAuxiliarId: acceso.userId }] },
    select: { id: true, rit: true, caratulado: true, estado: true, _count: { select: { adjuntosFiscales: true, escritos: true } } },
    orderBy: { actualizadaEn: "desc" },
  });
  const guardado = searchParams?.guardado;

  return (
    <MiFiscaliaShell title="Gestionar mis causas" rol={acceso.rol}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0F69B4]">Fiscalía en Línea</p><h2 className="mt-2 text-3xl font-black text-[#12314d]">Gestionar mis causas</h2><p className="mt-2 max-w-2xl text-sm text-[#526a7d]">Adjunta antecedentes y prepara escritos para los expedientes bajo tu responsabilidad.</p></div>
          <span className="rounded-sm bg-[#EB3C46]/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#c52e38]">Acceso fiscal</span>
        </div>
        {guardado && <p className="mb-5 rounded-lg border border-[#0F69B4]/20 bg-[#0F69B4]/5 px-4 py-3 text-sm text-[#0F69B4]">{guardado === "prueba" ? "La prueba fue adjuntada correctamente." : "El escrito fue guardado correctamente."}</p>}
        <div className="grid gap-5">
          {causas.map((causa) => (
            <section key={causa.id} className="overflow-hidden rounded-sm border border-[#d8e5ee] bg-white shadow-[0_14px_35px_rgba(15,105,180,0.08)]">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5edf2] px-5 py-4"><div><p className="font-mono text-xs font-bold uppercase tracking-wider text-[#0F69B4]">RIT {causa.rit}</p><h3 className="mt-1 text-xl font-black text-[#12314d]">{causa.caratulado}</h3></div><span className="rounded-sm bg-[#0F69B4]/10 px-3 py-1 text-xs font-bold uppercase text-[#0F69B4]">{causa.estado.replace(/_/g, " ")}</span></header>
              <div className="grid gap-5 p-5 lg:grid-cols-2">
                <form action={agregarPrueba} className="rounded-sm border border-[#b9d8ee] bg-[#f7fbfe] p-5"><input type="hidden" name="causaId" value={causa.id} /><h4 className="text-lg font-black text-[#12314d]">Adjuntar pruebas</h4><p className="mt-1 text-sm text-[#60788b]">Imágenes o documentos PDF de hasta 10 MB.</p><label className="mt-4 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-sm border-2 border-dashed border-[#0F69B4]/40 bg-white px-4 text-center transition hover:border-[#EB3C46] hover:bg-[#fffafa]"><span className="text-3xl text-[#0F69B4]">↑</span><span className="mt-2 text-sm font-bold text-[#12314d]">Seleccionar archivo</span><span className="mt-1 text-xs text-[#718697]">Evidencia visual o PDF</span><input type="file" name="archivo" required accept="image/*,application/pdf" className="sr-only" /></label><div className="mt-3 flex gap-2"><select name="tipo" className="min-w-0 flex-1 rounded-sm border border-[#cfe0eb] bg-white px-3 py-2 text-sm"><option value="EVIDENCIA_VISUAL">Evidencia visual</option><option value="OFICIO">Oficio en PDF</option></select><button className="rounded-sm bg-[#0F69B4] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#EB3C46]">Adjuntar</button></div><p className="mt-3 text-xs text-[#718697]">{causa._count.adjuntosFiscales} archivo(s) asociado(s)</p></form>
                <form action={guardarEscrito} className="rounded-sm border border-[#f3c4c8] bg-[#fffafb] p-5"><input type="hidden" name="causaId" value={causa.id} /><h4 className="text-lg font-black text-[#12314d]">Redactar escrito</h4><p className="mt-1 text-sm text-[#60788b]">Prepara el contenido del documento para la causa seleccionada.</p><div className="mt-4 grid gap-3"><input name="titulo" required placeholder="Título del escrito" className="rounded-sm border border-[#e8c7ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#EB3C46]" /><select name="tipoEscrito" className="rounded-sm border border-[#e8c7ca] bg-white px-3 py-2.5 text-sm"><option value="OTRO">Tipo de escrito</option><option value="FORMALIZACION">Formalización</option><option value="ACUSACION">Acusación</option><option value="PRUEBA">Solicitud de prueba</option><option value="RECURSO">Recurso</option></select><textarea name="contenido" required rows={7} placeholder="Escribe aquí los fundamentos y solicitudes..." className="resize-y rounded-sm border border-[#e8c7ca] bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-[#EB3C46]" /></div><div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-[#718697]">{causa._count.escritos} escrito(s) registrado(s)</span><button className="rounded-sm bg-[#EB3C46] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#c92c36]">Guardar escrito</button></div></form>
              </div>
            </section>
          ))}
          {!causas.length && <div className="rounded-sm border border-dashed border-[#b9d8ee] bg-white p-12 text-center text-[#60788b]"><h3 className="text-xl font-black text-[#12314d]">No tienes causas asignadas</h3><p className="mt-2 text-sm">Las causas asignadas aparecerán aquí para su gestión.</p></div>}
        </div>
      </div>
    </MiFiscaliaShell>
  );
}
