import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import DashboardShell from "@/components/DashboardShell";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function registrarParte(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; rol?: string } | undefined;
  if (!user?.id || user.rol !== "FUNCIONARIO") redirect("/tramite-facil");
  const value = (name: string) => String(formData.get(name) ?? "").trim();
  const tipoProcedimiento = value("tipoProcedimiento");
  const fechaProcedimiento = value("fechaProcedimiento");
  const lugar = value("lugar");
  const unidadPolicial = value("unidadPolicial");
  const funcionarioResponsable = value("funcionarioResponsable");
  const relato = value("relato");
  if (!tipoProcedimiento || !fechaProcedimiento || !lugar || !unidadPolicial || !funcionarioResponsable || !relato) return;
  await prisma.partePolicial.create({ data: { tipoProcedimiento, fechaProcedimiento, horaProcedimiento: value("horaProcedimiento") || null, lugar, unidadPolicial, funcionarioResponsable, involucrados: value("involucrados") || null, relato, observaciones: value("observaciones") || null, registradorId: user.id! } });
  revalidatePath("/tramite-facil/partes-policiales");
}

export default async function PartesPolicialesPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; rol?: string } | undefined;
  if (!user?.id || user.rol !== "FUNCIONARIO") redirect("/tramite-facil");
  const partes = await prisma.partePolicial.findMany({ orderBy: { creadoEn: "desc" }, take: 30 });
  return <DashboardShell rol={user.rol!} titulo="Registro Partes Policiales"><div className="mx-auto max-w-5xl grid gap-5"><section className="ojv-card"><div className="ojv-tabs"><Link href="/tramite-facil" className="ojv-tab">Trámite Fácil</Link><span className="ojv-tab ojv-tab-active">Registro Partes Policiales</span></div><form action={registrarParte} className="ojv-form grid gap-4"><div className="grid gap-4 md:grid-cols-2"><label className="ojv-label">Tipo de procedimiento<input name="tipoProcedimiento" required placeholder="Detención, control, traslado..." className="ojv-input" /></label><label className="ojv-label">Unidad policial<input name="unidadPolicial" required className="ojv-input" /></label><label className="ojv-label">Fecha<input name="fechaProcedimiento" required type="date" className="ojv-input" /></label><label className="ojv-label">Hora<input name="horaProcedimiento" type="time" className="ojv-input" /></label><label className="ojv-label md:col-span-2">Lugar<input name="lugar" required className="ojv-input" /></label><label className="ojv-label md:col-span-2">Funcionario responsable<input name="funcionarioResponsable" required className="ojv-input" /></label></div><label className="ojv-label">Personas involucradas<textarea name="involucrados" rows={3} className="ojv-input" /></label><label className="ojv-label">Relato del procedimiento<textarea name="relato" required rows={6} className="ojv-input" /></label><label className="ojv-label">Observaciones<textarea name="observaciones" rows={3} className="ojv-input" /></label><button className="ojv-search justify-self-start">Registrar parte policial</button></form></section><section className="ojv-card"><div className="ojv-form grid gap-3"><h2 className="font-display text-xl text-[#12486d]">Partes registrados</h2>{partes.map((parte) => <article key={parte.id} className="border border-[#d3d9dc] bg-[#fafafa] p-4"><p className="font-semibold text-[#12486d]">{parte.tipoProcedimiento}</p><p className="text-xs text-grafito/55">{parte.fechaProcedimiento} · {parte.lugar} · {parte.unidadPolicial}</p><p className="mt-2 whitespace-pre-wrap text-sm text-grafito/70">{parte.relato}</p></article>)}{!partes.length && <p className="text-sm text-grafito/50">No hay partes registrados.</p>}</div></section></div></DashboardShell>;
}
