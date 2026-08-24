import { getServerSession } from "next-auth";
import { nombreLegal } from "@/lib/identidad";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import DashboardShell from "@/components/DashboardShell";
import Link from "next/link";
import { publicarCausaEnDiscord } from "@/lib/discordForum";
import { ESTILO_ESTADO_CAUSA, ESTILO_ESTADO_ORDEN, etiquetaEstado } from "@/lib/estilos";
import { contextoSesion, puedeAccederCausa } from "@/lib/autorizacion";
import { esAdministracionSuperior } from "@/lib/autorizacion";


export const dynamic = "force-dynamic";
async function presentarEscrito(causaId: string, formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const contexto = contextoSesion(session);
  if (!contexto || !(await puedeAccederCausa(causaId, contexto))) return;
  const autorId = contexto.userId;

  await prisma.escrito.create({
    data: {
      causaId,
      autorId,
      tipo: String(formData.get("tipo")) as any,
      titulo: String(formData.get("titulo")),
      contenido: String(formData.get("contenido")),
    },
  });
  await publicarCausaEnDiscord(causaId, "Nuevo escrito presentado");
  revalidatePath(`/causas/${causaId}`);
}

async function asumirDefensa(causaId: string) {
  "use server";
  const session = await getServerSession(authOptions);
  const abogadoId = (session?.user as any)?.id as string;
  const rol = (session?.user as any)?.rol;
  if (!abogadoId || (rol !== "ABOGADO" && !esAdministracionSuperior(rol))) return;
  if (!(await puedeAccederCausa(causaId, { userId: abogadoId, rol }))) return;

  if (!esAdministracionSuperior(rol)) {
    const cert = await prisma.certificacionAbogado.findUnique({ where: { userId: abogadoId } });
    if (!cert || cert.estado !== "APROBADA") return;
  }

  await prisma.defensa.create({ data: { causaId, abogadoId } });
  await publicarCausaEnDiscord(causaId, "Defensa técnica actualizada");
  revalidatePath(`/causas/${causaId}`);
}

async function tomarCausaComoJuez(causaId: string) {
  "use server";
  const session = await getServerSession(authOptions);
  const juezId = (session?.user as any)?.id as string;
  const rol = (session?.user as any)?.rol;
  if (!juezId || (rol !== "JUEZ" && !esAdministracionSuperior(rol))) return;
  const causa = await prisma.causa.findUnique({ where: { id: causaId }, select: { juezId: true } });
  if (!causa || (!esAdministracionSuperior(rol) && causa.juezId && causa.juezId !== juezId)) return;

  await prisma.causa.update({ where: { id: causaId }, data: { juezId } });
  await publicarCausaEnDiscord(causaId, "Juez asignado");
  revalidatePath(`/causas/${causaId}`);
}

async function programarAudiencia(causaId: string, formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const creadorId = (session?.user as any)?.id as string;
  const rol = (session?.user as any)?.rol;
  if (!creadorId || (rol !== "JUEZ" && rol !== "FISCAL" && !esAdministracionSuperior(rol))) return;
  if (!(await puedeAccederCausa(causaId, { userId: creadorId, rol }))) return;

  const fecha = String(formData.get("fecha"));
  const hora = String(formData.get("hora"));
  const fechaHora = new Date(`${fecha}T${hora}`);
  if (isNaN(fechaHora.getTime())) return;

  await prisma.audiencia.create({
    data: {
      causaId,
      creadorId,
      tipo: String(formData.get("tipo")) as any,
      fechaHora,
      sala: String(formData.get("sala") ?? "") || null,
      notas: String(formData.get("notas") ?? "") || null,
    },
  });
  await publicarCausaEnDiscord(causaId, "Audiencia programada");
  revalidatePath(`/causas/${causaId}`);
}

async function dictarSentencia(causaId: string, juezId: string, formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol;
  const sessionUserId = (session?.user as any)?.id;
  if (sessionUserId !== juezId || (rol !== "JUEZ" && !esAdministracionSuperior(rol))) return;
  const causa = await prisma.causa.findUnique({ where: { id: causaId }, select: { juezId: true, sentencia: true } });
  if (!causa || (!esAdministracionSuperior(rol) && causa.juezId !== sessionUserId) || causa.sentencia) return;

  await prisma.sentencia.create({
    data: {
      causaId,
      juezId,
      resultado: String(formData.get("resultado")) as any,
      fundamento: String(formData.get("fundamento")),
      pena: String(formData.get("pena") ?? ""),
    },
  });
  await prisma.causa.update({ where: { id: causaId }, data: { estado: "SENTENCIADA" } });
  await publicarCausaEnDiscord(causaId, "Sentencia dictada");
  revalidatePath(`/causas/${causaId}`);
}

type EstadoEditable = "EN_INVESTIGACION" | "EN_ESPERA_JUICIO" | "CERRADA" | "EN_APELACION" | "ARCHIVADA" | "SOBRESEIDA";

async function cambiarEstadoCausa(causaId: string, estado: EstadoEditable | FormData, _formData?: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string;
  const rol = (session?.user as any)?.rol;
  if (!userId || (rol !== "FISCAL" && rol !== "JUEZ" && !esAdministracionSuperior(rol))) return;
  const nuevoEstado = estado instanceof FormData ? String(estado.get("estado")) : estado;
  const estadosPermitidos: EstadoEditable[] = ["EN_INVESTIGACION", "EN_ESPERA_JUICIO", "CERRADA", "EN_APELACION", "ARCHIVADA", "SOBRESEIDA"];
  if (!estadosPermitidos.includes(nuevoEstado as EstadoEditable)) return;
  const causa = await prisma.causa.findUnique({ where: { id: causaId }, select: { fiscalId: true, juezId: true } });
  if (!causa || (!esAdministracionSuperior(rol) && causa.fiscalId !== userId && causa.juezId !== userId)) return;
  await prisma.causa.update({ where: { id: causaId }, data: { estado: nuevoEstado as any } });
  await publicarCausaEnDiscord(causaId, `Estado actualizado a ${nuevoEstado.replace(/_/g, " ")}`);
  revalidatePath(`/causas/${causaId}`);
  revalidatePath("/causas");
}

async function crearOrdenCaptura(causaId: string, formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const solicitanteId = (session?.user as any)?.id as string;
  const rol = (session?.user as any)?.rol;
  if (!solicitanteId || (rol !== "JUEZ" && !esAdministracionSuperior(rol))) return;
  const nombrePersona = String(formData.get("nombrePersona") ?? "").trim();
  const motivo = String(formData.get("motivo") ?? "").trim();
  if (!nombrePersona || !motivo) return;
  await prisma.ordenCaptura.create({ data: { causaId, solicitadoPorId: solicitanteId, nombrePersona, motivo } });
  await publicarCausaEnDiscord(causaId, "Nueva orden de captura emitida");
  revalidatePath(`/causas/${causaId}`);
}

async function levantarOrdenCaptura(ordenId: string, causaId: string) {
  "use server";
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol;
  const userId = (session?.user as any)?.id as string;
  if (!userId || (rol !== "JUEZ" && !esAdministracionSuperior(rol))) return;
  const orden = await prisma.ordenCaptura.findUnique({ where: { id: ordenId }, select: { causaId: true, estado: true } });
  if (!orden || orden.causaId !== causaId || orden.estado === "LEVANTADA") return;
  const causa = await prisma.causa.findUnique({ where: { id: causaId }, select: { juezId: true } });
  if (!causa || (!esAdministracionSuperior(rol) && causa.juezId !== userId)) return;
  await prisma.ordenCaptura.update({ where: { id: ordenId }, data: { estado: "LEVANTADA", levantadaEn: new Date() } });
  await publicarCausaEnDiscord(causaId, "Orden de captura levantada");
  revalidatePath(`/causas/${causaId}`);
}

async function eliminarCausa(causaId: string) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!esAdministracionSuperior((session?.user as any)?.rol)) return;
  await prisma.causa.delete({ where: { id: causaId } });
  redirect("/causas");
}

export default async function CausaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string;
  const rol = (session?.user as any)?.rol as string;
  const contexto = contextoSesion(session);
  if (!contexto || !(await puedeAccederCausa(id, contexto))) return notFound();

  const causa = await prisma.causa.findUnique({
    where: { id },
    include: {
      fiscal: true,
      juez: true,
      partes: { include: { user: true } },
      defensas: { where: { activa: true }, include: { abogado: true } },
      escritos: { include: { autor: true }, orderBy: { presentadoEn: "desc" } },
      audiencias: { orderBy: { fechaHora: "asc" } },
      sentencia: true,
      adjuntosFiscales: { orderBy: { creadoEn: "desc" } },
      testimonios: { orderBy: { creadoEn: "desc" } },
    },
  });

  if (!causa) notFound();
  // Permite seguir abriendo expedientes mientras una instalación existente
  // termina de aplicar la tabla nueva de órdenes de captura.
  let ordenesCaptura: any[] = [];
  try {
    ordenesCaptura = await prisma.ordenCaptura.findMany({
      where: { causaId: causa.id },
      orderBy: { emitidaEn: "desc" },
      include: { solicitadoPor: true },
    });
  } catch (error) {
    console.warn("Órdenes de captura no disponibles todavía:", error);
  }

  const esJuezDeLaCausa = causa.juezId === userId;
  const esFiscalDeLaCausa = causa.fiscalId === userId;
  // Los ADMIN representan a la Corte Suprema: tienen todas las facultades de un juez sobre cualquier causa.
  const actuaComoJuez = esJuezDeLaCausa || esAdministracionSuperior(rol);
  const puedeDictarSentencia = actuaComoJuez && causa.estado === "EN_JUICIO" && !causa.sentencia;
  const puedeAsumirDefensa = (rol === "ABOGADO" || esAdministracionSuperior(rol)) && !causa.defensas.some((d) => d.abogadoId === userId);
  const puedeTomarCausa = (rol === "JUEZ" || esAdministracionSuperior(rol)) && !esJuezDeLaCausa;
  const puedeProgramarAudiencia = actuaComoJuez || esFiscalDeLaCausa;
  const puedeEditarEstado = esAdministracionSuperior(rol) || esFiscalDeLaCausa || esJuezDeLaCausa;
  const estadosCausa = [
    ["EN_INVESTIGACION", "En investigación"],
    ["EN_ESPERA_JUICIO", "En espera de juicio"],
    ["EN_JUICIO", "En juicio"],
    ["EN_APELACION", "En apelación"],
    ["SOBRESEIDA", "Desestimada"],
    ["ARCHIVADA", "Archivada"],
    ["CERRADA", "Cerrada"],
  ] as const;

  return (
    <DashboardShell rol={rol} titulo="Expediente completo">
      <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/causas" className="button-outline">← Volver al panel general</Link>
        <a href={`/api/causas/${causa.id}/pdf`} className="button-primary">Descargar expediente PDF</a>
      </div>
      {puedeEditarEstado && (
        <section className="mb-6 rounded-xl border border-blue-100 bg-blue-50/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow text-blue-700">Tramitación del expediente</p>
              <p className="mt-1 text-sm text-grafito/55">Fiscal y juez pueden actualizar el estado de esta causa.</p>
            </div>
            <form action={cambiarEstadoCausa.bind(null, causa.id)} className="flex flex-wrap gap-2">
              <select name="estado" defaultValue={causa.estado} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-marino-950">
                {estadosCausa.map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
              </select>
              <button className="button-primary">Actualizar estado</button>
            </form>
          </div>
        </section>
      )}
      <div className="bg-marino-950 text-hueso rounded-xl p-6 mb-6 relative overflow-hidden">
        <div className="sello absolute inset-0 pointer-events-none" />
        <div className="relative">
          <p className="font-mono text-xs text-dorado-300 uppercase tracking-widest mb-2">RIT {causa.rit}</p>
          <div className="flex flex-wrap justify-between items-start gap-3">
            <h1 className="font-display text-3xl leading-tight">{causa.caratulado}</h1>
            <span className={`badge ${ESTILO_ESTADO_CAUSA[causa.estado] ?? "bg-hueso/10"}`}>
              {etiquetaEstado(causa.estado)}
            </span>
          </div>
        </div>
      </div>

      <section className="panel-card p-6 mb-6">
        <p className="text-sm text-grafito/50 mb-1">Delito</p>
        <p className="mb-4">{causa.delito}</p>
        <p className="text-sm text-grafito/50 mb-1">Descripción</p>
        <p className="mb-4 whitespace-pre-wrap">{causa.descripcion}</p>
        <p className="text-sm text-grafito/50">
          Fiscal: {nombreLegal(causa.fiscal)} · Juez: {causa.juez ? nombreLegal(causa.juez) : "Sin asignar"}
        </p>
        {puedeTomarCausa && (
          <form action={tomarCausaComoJuez.bind(null, causa.id)} className="mt-4">
            <button className="button-primary">
              Tomar esta causa
            </button>
          </form>
        )}
      </section>

      <section className="panel-card p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-display text-xl">Antecedentes de fiscalía</h2><p className="mt-1 text-sm text-grafito/50">Pruebas visuales, oficios y testimonios incorporados al expediente.</p></div>
          <span className="rounded-full bg-blue-50 px-3 py-1 font-mono text-xs text-blue-700">{causa.adjuntosFiscales.length} archivos · {causa.testimonios.length} testimonios</span>
        </div>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div>
            <p className="eyebrow text-blue-700">Archivos</p>
            <div className="mt-2 space-y-2">
              {causa.adjuntosFiscales.map((adjunto) => <a key={adjunto.id} href={`/api/fiscal/adjuntos/${adjunto.id}`} target="_blank" className="block rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2 text-sm text-blue-700 hover:underline">↗ {adjunto.nombre} <span className="text-xs text-grafito/40">({adjunto.tipo === "OFICIO" ? "oficio PDF" : "evidencia visual"})</span></a>)}
              {!causa.adjuntosFiscales.length && <p className="text-sm text-grafito/40">Sin archivos adjuntos.</p>}
            </div>
          </div>
          <div>
            <p className="eyebrow text-blue-700">Testimonios</p>
            <div className="mt-2 space-y-2">
              {causa.testimonios.map((testimonio) => <div key={testimonio.id} className="rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2"><p className="text-sm font-medium text-marino-950">{testimonio.declarante}</p><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-grafito/60">{testimonio.contenido}</p></div>)}
              {!causa.testimonios.length && <p className="text-sm text-grafito/40">Sin testimonios registrados.</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="panel-card p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="font-display text-xl">Órdenes de captura</h2><p className="mt-1 text-sm text-grafito/50">Medidas emitidas por el tribunal dentro de esta causa.</p></div>
          <span className="rounded-full bg-blue-50 px-3 py-1 font-mono text-xs text-blue-800">{ordenesCaptura.filter((o) => o.estado === "VIGENTE").length} vigentes</span>
        </div>
        <div className="mt-4 grid gap-3">
          {ordenesCaptura.map((orden) => (
            <div key={orden.id} className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
              <div className="flex flex-wrap justify-between gap-2"><p className="font-medium text-marino-950">{orden.nombrePersona}</p><span className={`badge ${ESTILO_ESTADO_ORDEN[orden.estado] ?? "bg-grafito/10"}`}>{orden.estado}</span></div>
              <p className="mt-2 text-sm text-grafito/65">{orden.motivo}</p>
              <p className="mt-2 text-xs text-grafito/40">Emitida el {format(orden.emitidaEn, "dd/MM/yyyy HH:mm")} por {orden.solicitadoPor.name}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={`/api/ordenes-captura/${orden.id}/pdf`} className="button-primary">Descargar PDF</a>
                {orden.estado === "VIGENTE" && (rol === "JUEZ" || esAdministracionSuperior(rol)) && <form action={levantarOrdenCaptura.bind(null, orden.id, causa.id)}><button className="button-outline">Levantar orden</button></form>}
              </div>
            </div>
          ))}
          {!ordenesCaptura.length && <p className="text-sm text-grafito/45">No hay órdenes emitidas.</p>}
        </div>
        {(rol === "JUEZ" || esAdministracionSuperior(rol)) && <form action={crearOrdenCaptura.bind(null, causa.id)} className="mt-5 grid gap-3 border-t border-grafito/10 pt-5 sm:grid-cols-2">
          <input name="nombrePersona" required placeholder="Nombre de la persona" className="border border-grafito/15 rounded-lg px-3 py-2 text-sm" />
          <input name="motivo" required placeholder="Motivo de la orden" className="border border-grafito/15 rounded-lg px-3 py-2 text-sm" />
          <button className="button-primary justify-self-start sm:col-span-2">Emitir orden de captura</button>
        </form>}
      </section>

      {/* Defensa técnica */}
      <section className="panel-card p-6 mb-6">
        <h2 className="font-display text-xl mb-3">Defensa técnica</h2>
        {causa.defensas.length === 0 ? (
          <p className="text-grafito/50 text-sm mb-3">Aún no hay abogado defensor asignado.</p>
        ) : (
          <ul className="text-sm mb-3">
            {causa.defensas.map((d) => (
              <li key={d.id}>{nombreLegal(d.abogado)}</li>
            ))}
          </ul>
        )}
        {puedeAsumirDefensa && (
          <form action={asumirDefensa.bind(null, causa.id)}>
            <button className="button-primary">
              Asumir defensa
            </button>
          </form>
        )}
      </section>

      {/* Escritos */}
      <section className="panel-card p-6 mb-6">
        <h2 className="font-display text-xl mb-3">Escritos presentados</h2>
        <div className="grid gap-3 mb-5">
          {causa.escritos.map((e) => (
            <div key={e.id} className="border-t border-grafito/10 pt-3 first:border-t-0 first:pt-0">
              <p className="text-xs font-mono text-grafito/40 uppercase">
                {e.tipo} · {nombreLegal(e.autor)} · {format(e.presentadoEn, "dd/MM/yyyy HH:mm")}
              </p>
              <p className="font-semibold">{e.titulo}</p>
              <p className="text-sm text-grafito/60 whitespace-pre-wrap">{e.contenido}</p>
            </div>
          ))}
          {causa.escritos.length === 0 && <p className="text-grafito/50 text-sm">Sin escritos aún.</p>}
        </div>

        {session && (
          <form action={presentarEscrito.bind(null, causa.id)} className="grid gap-3 border-t border-grafito/10 pt-4">
            <div className="flex gap-3">
              <select name="tipo" className="border border-grafito/15 rounded-lg px-3 py-2 text-sm">
                <option value="QUERELLA">Querella</option>
                <option value="FORMALIZACION">Formalización</option>
                <option value="ACUSACION">Acusación</option>
                <option value="CONTESTACION">Contestación</option>
                <option value="PRUEBA">Prueba</option>
                <option value="RECURSO">Recurso</option>
                <option value="OTRO">Otro</option>
              </select>
              <input name="titulo" required placeholder="Título del escrito" className="flex-1 border border-grafito/15 rounded-lg px-3 py-2 text-sm" />
            </div>
            <textarea name="contenido" required rows={4} placeholder="Contenido..." className="border border-grafito/15 rounded-lg px-3 py-2 text-sm" />
            <button className="button-primary justify-self-start">
              Presentar escrito
            </button>
          </form>
        )}
      </section>

      {/* Audiencias */}
      <section className="panel-card p-6 mb-6">
        <h2 className="font-display text-xl mb-3">Audiencias</h2>
        {causa.audiencias.length === 0 ? (
          <p className="text-grafito/50 text-sm mb-4">Sin audiencias programadas.</p>
        ) : (
          <ul className="text-sm grid gap-2 mb-4">
            {causa.audiencias.map((a) => (
              <li key={a.id} className="flex justify-between border-t border-grafito/10 pt-2 first:border-t-0 first:pt-0">
                <span>{a.tipo.replace(/_/g, " ")}</span>
                <span className="text-grafito/50">{format(a.fechaHora, "dd/MM/yyyy HH:mm")}</span>
                <span className="text-grafito/50">{a.sala ?? ""}</span>
                <span className="font-mono text-xs uppercase">{a.estado}</span>
              </li>
            ))}
          </ul>
        )}

        {puedeProgramarAudiencia && (
          <form action={programarAudiencia.bind(null, causa.id)} className="grid gap-3 border-t border-grafito/10 pt-4">
            <div className="flex gap-3">
              <select name="tipo" className="border border-grafito/15 rounded-lg px-3 py-2 text-sm">
                <option value="FORMALIZACION">Formalización</option>
                <option value="PREPARACION_JUICIO">Preparación de juicio</option>
                <option value="JUICIO_ORAL">Juicio oral</option>
                <option value="LECTURA_SENTENCIA">Lectura de sentencia</option>
                <option value="OTRA">Otra</option>
              </select>
              <input name="sala" placeholder="Sala (opcional)" className="flex-1 border border-grafito/15 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3">
              <input type="date" name="fecha" required className="border border-grafito/15 rounded-lg px-3 py-2 text-sm" />
              <input type="time" name="hora" required className="border border-grafito/15 rounded-lg px-3 py-2 text-sm" />
            </div>
            <input name="notas" placeholder="Notas (opcional)" className="border border-grafito/15 rounded-lg px-3 py-2 text-sm" />
            <button className="button-primary justify-self-start">
              Programar audiencia
            </button>
          </form>
        )}
      </section>

      {/* Sentencia */}
      <section className="panel-card p-6">
        <h2 className="font-display text-xl mb-3">Sentencia</h2>
        {causa.sentencia ? (
          <div>
            <p className="font-mono text-xs uppercase text-grafito/40 mb-1">{causa.sentencia.resultado}</p>
            <p className="whitespace-pre-wrap mb-2">{causa.sentencia.fundamento}</p>
            {causa.sentencia.pena && <p className="text-sm text-grafito/60">Pena: {causa.sentencia.pena}</p>}
          </div>
        ) : puedeDictarSentencia ? (
          <form action={dictarSentencia.bind(null, causa.id, userId)} className="grid gap-3">
            <select name="resultado" className="border border-grafito/15 rounded-lg px-3 py-2 text-sm">
              <option value="CONDENATORIA">Condenatoria</option>
              <option value="ABSOLUTORIA">Absolutoria</option>
            </select>
            <textarea name="fundamento" required rows={4} placeholder="Fundamento de la sentencia..." className="border border-grafito/15 rounded-lg px-3 py-2 text-sm" />
            <input name="pena" placeholder="Pena (si corresponde)" className="border border-grafito/15 rounded-lg px-3 py-2 text-sm" />
            <button className="button-primary justify-self-start">
              Dictar sentencia
            </button>
          </form>
        ) : (
          <p className="text-grafito/50 text-sm">Aún no se ha dictado sentencia.</p>
        )}
      </section>
      {(rol === "JUEZ" || esAdministracionSuperior(rol)) && causa.estado !== "SENTENCIADA" && (
        <section className="mt-6 rounded-xl border border-blue-100 bg-blue-50/50 p-5">
          <p className="eyebrow text-blue-700">Resolución del expediente</p>
          <p className="mt-1 text-sm text-grafito/55">Desestima o archiva la causa cuando corresponda.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <form action={cambiarEstadoCausa.bind(null, causa.id, "SOBRESEIDA")}><button className="button-outline">Desestimar caso</button></form>
            <form action={cambiarEstadoCausa.bind(null, causa.id, "ARCHIVADA")}><button className="button-outline">Archivar causa</button></form>
          </div>
        </section>
      )}
      {esAdministracionSuperior(rol) && (
        <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 p-5">
          <div><p className="eyebrow text-red-700">Zona de administración</p><p className="mt-1 text-sm text-red-900/70">Eliminar esta causa borra también sus escritos, audiencias, defensas y órdenes de captura.</p></div>
          <form action={eliminarCausa.bind(null, causa.id)}><button className="rounded-lg bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800">Eliminar causa</button></form>
        </section>
      )}
      </div>
    </DashboardShell>
  );
}
