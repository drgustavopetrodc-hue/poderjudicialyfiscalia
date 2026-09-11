import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import DashboardShell from "@/components/DashboardShell";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const ROLES_DEMANDANTE = ["ABOGADO", "FISCAL", "ADMIN"];

async function presentarDemanda(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; rol?: string } | undefined;
  if (!user?.id || !ROLES_DEMANDANTE.includes(user.rol ?? "")) redirect("/ingreso-causas");
  const value = (name: string) => String(formData.get(name) ?? "").trim();
  const tribunal = value("tribunal");
  const materia = value("materia");
  const demandante = value("demandante");
  const demandado = value("demandado");
  const hechos = value("hechos");
  const fundamentosDerecho = value("fundamentosDerecho");
  const peticiones = value("peticiones");
  if (!tribunal || !materia || !demandante || !demandado || !hechos || !fundamentosDerecho || !peticiones) return;
  const archivo = formData.get("archivo");
  let datos: Buffer | undefined;
  let nombre: string | undefined;
  let mime: string | undefined;
  let tamano: number | undefined;
  if (archivo instanceof File && archivo.size > 0) {
    if (archivo.size > 10 * 1024 * 1024 || !["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(archivo.type)) return;
    datos = Buffer.from(await archivo.arrayBuffer());
    nombre = archivo.name.slice(0, 200);
    mime = archivo.type;
    tamano = archivo.size;
  }
  const demanda = await prisma.demanda.create({
    data: { tribunal, materia, demandante, demandanteRut: value("demandanteRut") || null, demandado, demandadoRut: value("demandadoRut") || null, hechos, fundamentosDerecho, peticiones, documentosDescripcion: value("documentosDescripcion") || null, archivoDatos: datos, archivoNombre: nombre, archivoMimeType: mime, archivoTamano: tamano, presentadaPorId: user.id! },
  });
  revalidatePath("/ingreso-causas/demanda");
  redirect(`/ingreso-causas/demanda?creada=${demanda.id}`);
}

export default async function DemandaPage({ searchParams }: { searchParams?: { creada?: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; rol?: string } | undefined;
  if (!user?.id || !user.rol) redirect("/ingreso-causas/acceso");
  if (!ROLES_DEMANDANTE.includes(user.rol)) redirect("/ingreso-causas");
  const demandas = await prisma.demanda.findMany({ where: user.rol === "ADMIN" ? undefined : { presentadaPorId: user.id }, orderBy: { creadoEn: "desc" }, take: 30 });
  return <DashboardShell rol={user.rol} titulo="Ingresar demanda"><div className="mx-auto max-w-5xl grid gap-5"><section className="ojv-card"><div className="ojv-tabs"><Link href="/ingreso-causas" className="ojv-tab">Ingreso de causas y escritos</Link><span className="ojv-tab ojv-tab-active">Ingresar demanda</span></div><form action={presentarDemanda} encType="multipart/form-data" className="ojv-form grid gap-4"><p className="text-sm text-grafito/60">Completa los antecedentes esenciales de la demanda. El sistema registrará la presentación para revisión.</p><div className="grid gap-4 md:grid-cols-2"><label className="ojv-label">Tribunal competente<input name="tribunal" required className="ojv-input" placeholder="Juzgado competente" /></label><label className="ojv-label">Materia<input name="materia" required className="ojv-input" placeholder="Civil, familia, laboral..." /></label><label className="ojv-label">Demandante<input name="demandante" required className="ojv-input" /></label><label className="ojv-label">RUT del demandante<input name="demandanteRut" className="ojv-input" /></label><label className="ojv-label">Demandado<input name="demandado" required className="ojv-input" /></label><label className="ojv-label">RUT del demandado<input name="demandadoRut" className="ojv-input" /></label></div><label className="ojv-label">Hechos<textarea name="hechos" required rows={7} className="ojv-input" placeholder="Relata los hechos en orden cronológico." /></label><label className="ojv-label">Fundamentos de derecho<textarea name="fundamentosDerecho" required rows={6} className="ojv-input" placeholder="Normas y fundamentos que sustentan la demanda." /></label><label className="ojv-label">Peticiones concretas<textarea name="peticiones" required rows={5} className="ojv-input" placeholder="Solicita al tribunal lo que corresponda resolver." /></label><label className="ojv-label">Documentos ofrecidos<textarea name="documentosDescripcion" rows={3} className="ojv-input" placeholder="Describe documentos o medios de prueba." /></label><label className="ojv-label">Anexo PDF o DOCX (opcional)<input name="archivo" type="file" accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="ojv-input" /><span className="font-normal text-[10px] text-grafito/45">Máximo 10 MB.</span></label><button className="ojv-search justify-self-start">Presentar demanda</button></form>{searchParams?.creada && <p className="px-5 pb-5 text-sm text-green-700">Demanda ingresada correctamente. Puedes descargar su constancia en el listado.</p>}</section><section className="ojv-card"><div className="ojv-form grid gap-3"><h2 className="font-display text-xl text-[#12486d]">Mis demandas ingresadas</h2>{demandas.map((demanda) => <article key={demanda.id} className="border border-[#d3d9dc] bg-[#fafafa] p-4"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-[#12486d]">{demanda.materia} · {demanda.tribunal}</h3><span className="text-xs text-[#66813d]">{demanda.estado}</span></div><p className="mt-2 text-sm text-grafito/65">{demanda.demandante} contra {demanda.demandado} · {demanda.creadoEn.toLocaleDateString("es-CL")}</p><a href={`/api/ingreso-causas/demandas/${demanda.id}/pdf`} className="mt-3 inline-flex text-xs font-semibold text-[#12486d] underline">Descargar constancia PDF</a></article>)}{!demandas.length && <p className="text-sm text-grafito/50">No hay demandas ingresadas.</p>}</div></section></div></DashboardShell>;
}
