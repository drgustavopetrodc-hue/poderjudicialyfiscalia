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
        {guardado && <p className="mb-4 border border-[#c9dbe7] bg-[#f7fbfe] px-4 py-2.5 text-[13px] text-[#0F69B4]">{guardado === "prueba" ? "La prueba fue adjuntada correctamente." : "El escrito fue guardado correctamente."}</p>}
        <div className="grid gap-4">
          {causas.map((causa) => (
            <section key={causa.id} className="overflow-hidden rounded-[3px] border border-[#d9e0e4] bg-white shadow-[0_3px_13px_rgba(15,48,73,0.12)]">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f2] px-5 py-4"><div><p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#0F69B4]">RIT {causa.rit}</p><h3 className="mt-1 font-display text-lg font-bold text-[#12486d]">{causa.caratulado}</h3></div><span className="rounded-[2px] bg-[#0F69B4] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-white">{causa.estado.replace(/_/g, " ")}</span></header>
              <div className="grid gap-8 p-5 lg:grid-cols-2">
                <form action={agregarPrueba} className="min-w-0 p-0.5"><input type="hidden" name="causaId" value={causa.id} /><h4 className="font-display text-base font-bold text-[#12486d]">Adjuntar pruebas</h4><p className="mt-1 text-[13px] text-[#71808b]">Imágenes o documentos PDF de hasta 10 MB.</p><label className="mt-4 flex min-h-28 cursor-pointer flex-col items-center justify-center border border-dashed border-[#D1D5DB] bg-[#fafafa] px-4 text-center transition hover:border-[#0F69B4] hover:bg-[#f4f9fc]"><span className="text-xl font-light text-[#0F69B4]">↑</span><span className="mt-1 text-[13px] font-bold text-[#12486d]">Seleccionar archivo</span><span className="mt-1 text-xs text-[#71808b]">Evidencia visual o PDF</span><input type="file" name="archivo" required accept="image/*,application/pdf" className="sr-only" /></label><div className="mt-3 flex gap-2"><select name="tipo" className="min-w-0 flex-1 rounded-[2px] border border-[#d3d9dc] bg-[#fafafa] px-3 py-1.5 text-[13px] text-[#4b5563]"><option value="EVIDENCIA_VISUAL">Evidencia visual</option><option value="OFICIO">Oficio en PDF</option></select><button className="rounded-[3px] bg-[#0F69B4] px-3.5 py-1.5 text-[13px] font-bold text-white transition hover:bg-[#09558f]">Adjuntar</button></div><p className="mt-3 text-xs text-[#71808b]">{causa._count.adjuntosFiscales} archivo(s) asociado(s)</p></form>
                <form action={guardarEscrito} className="min-w-0 p-0.5"><input type="hidden" name="causaId" value={causa.id} /><h4 className="font-display text-base font-bold text-[#12486d]">Redactar escrito</h4><p className="mt-1 text-[13px] text-[#71808b]">Prepara el contenido del documento para la causa seleccionada.</p><div className="mt-4 grid gap-2.5"><input name="titulo" required placeholder="Título del escrito" className="rounded-[2px] border border-[#d3d9dc] bg-[#fafafa] px-3 py-2 text-[13px] text-[#4b5563] outline-none focus:border-[#0F69B4]" /><select name="tipoEscrito" className="rounded-[2px] border border-[#d3d9dc] bg-[#fafafa] px-3 py-2 text-[13px] text-[#4b5563] outline-none focus:border-[#0F69B4]"><option value="OTRO">Tipo de escrito</option><option value="FORMALIZACION">Formalización</option><option value="ACUSACION">Acusación</option><option value="PRUEBA">Solicitud de prueba</option><option value="RECURSO">Recurso</option></select><textarea name="contenido" required rows={6} placeholder="Escribe aquí los fundamentos y solicitudes..." className="resize-y rounded-[2px] border border-[#d3d9dc] bg-[#fafafa] px-3 py-2 text-[13px] leading-5 text-[#4b5563] outline-none focus:border-[#EB3C46]" /></div><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-[#71808b]">{causa._count.escritos} escrito(s) registrado(s)</span><button className="rounded-[3px] bg-[#EB3C46] px-3.5 py-1.5 text-[13px] font-bold text-white transition hover:bg-[#c92c36]">Guardar escrito</button></div></form>
              </div>
            </section>
          ))}
          {!causas.length && <div className="rounded-sm border border-dashed border-[#b9d8ee] bg-white p-12 text-center text-[#60788b]"><h3 className="text-xl font-black text-[#12314d]">No tienes causas asignadas</h3><p className="mt-2 text-sm">Las causas asignadas aparecerán aquí para su gestión.</p></div>}
        </div>
      </div>
    </MiFiscaliaShell>
  );
}
