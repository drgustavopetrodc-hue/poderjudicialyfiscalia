import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import DashboardShell from "@/components/DashboardShell";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CATEGORIAS = [
  ["FISCALIA", "Fiscalía"],
  ["PODER_JUDICIAL", "Poder Judicial"],
  ["DEFENSORIA_PENAL", "Defensoría Penal"],
] as const;

async function crearSolicitud(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; rol?: string } | undefined;
  if (!user?.id) redirect("/login");
  const categoria = String(formData.get("categoria") ?? "");
  const asunto = String(formData.get("asunto") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  if (!["FISCALIA", "PODER_JUDICIAL", "DEFENSORIA_PENAL"].includes(categoria) || !asunto || !descripcion) return;
  await prisma.solicitud.create({ data: { categoria: categoria as any, asunto, descripcion, creadorId: user.id } });
  revalidatePath("/tramite-facil/solicitudes");
}

export default async function SolicitudesPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; rol?: string } | undefined;
  if (!user?.id || !user.rol) redirect("/login");
  const categoriasVisibles = user.rol === "ADMIN" ? CATEGORIAS.map(([value]) => value) : user.rol === "FISCAL" ? ["FISCALIA"] : user.rol === "JUEZ" ? ["PODER_JUDICIAL"] : user.rol === "ABOGADO" ? ["DEFENSORIA_PENAL"] : [];
  const solicitudes = await prisma.solicitud.findMany({ where: { OR: [{ creadorId: user.id }, ...(categoriasVisibles.length ? [{ categoria: { in: categoriasVisibles as any } }] : [])] }, orderBy: { creadoEn: "desc" }, include: { creador: { select: { nombreIC: true, name: true } } }, take: 100 });
  return <DashboardShell rol={user.rol} titulo="Apertura de Solicitud"><div className="mx-auto max-w-5xl grid gap-5"><section className="ojv-card"><div className="ojv-tabs"><Link href="/tramite-facil" className="ojv-tab">Trámite Fácil</Link><span className="ojv-tab ojv-tab-active">Apertura de Solicitud</span></div><form action={crearSolicitud} className="ojv-form grid gap-4"><label className="ojv-label">Categoría<select name="categoria" required className="ojv-input">{CATEGORIAS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="ojv-label">Asunto<input name="asunto" required maxLength={180} className="ojv-input" /></label><label className="ojv-label">Descripción<textarea name="descripcion" required rows={6} className="ojv-input" /></label><button className="ojv-search justify-self-start">Abrir solicitud</button></form></section><section className="ojv-card"><div className="ojv-form grid gap-3"><h2 className="font-display text-xl text-[#12486d]">Solicitudes disponibles</h2>{solicitudes.map((solicitud) => <article key={solicitud.id} className="border border-[#d3d9dc] bg-[#fafafa] p-4"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-[#12486d]">{solicitud.asunto}</h3><span className="text-xs text-[#66813d]">{solicitud.categoria.replaceAll("_", " ")}</span></div><p className="mt-2 whitespace-pre-wrap text-sm text-grafito/70">{solicitud.descripcion}</p><p className="mt-2 text-xs text-grafito/45">Estado: {solicitud.estado} · Creada el {solicitud.creadoEn.toLocaleDateString("es-CL")}</p></article>)}{!solicitudes.length && <p className="text-sm text-grafito/50">No hay solicitudes para mostrar.</p>}</div></section></div></DashboardShell>;
}
