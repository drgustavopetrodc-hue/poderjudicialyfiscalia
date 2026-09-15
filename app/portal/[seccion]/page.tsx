import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { esFiscalRegional, esPresidenteCorteSuprema } from "@/lib/identidad";

type NotificacionVista = {
  id: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  creadaEn: Date;
  causa: { rit: string };
};

export const dynamic = "force-dynamic";

const SECCIONES: Record<string, { titulo: string; descripcion: string; vacio: string }> = {
  notificaciones: { titulo: "Mis notificaciones", descripcion: "Servicio que permite consultar las notificaciones de las causas en que figuras como parte. La notificación oficial se realiza por los medios correspondientes; esta sección facilita su búsqueda.", vacio: "No tienes notificaciones nuevas." },
  audiencias: { titulo: "Mis audiencias", descripcion: "Consulta las audiencias de las causas en que te encuentras registrado como parte. La citación oficial se incorpora a la tramitación de cada causa.", vacio: "No hay audiencias programadas." },
  "estado-diario": { titulo: "Mi estado diario", descripcion: "Consulta el estado de las presentaciones y actuaciones registradas durante el día.", vacio: "No hay movimientos registrados para hoy." },
  "certificado-desempeno": { titulo: "Mi certificado de desempeño", descripcion: "Consulta y descarga los certificados institucionales asociados a tu actividad.", vacio: "No hay certificados disponibles." },
  remates: { titulo: "Remates", descripcion: "Consulta los remates publicados por el Poder Judicial.", vacio: "No hay remates publicados." },
  transparencia: { titulo: "Transparencia institucional", descripcion: "Información institucional, normativa y documentos de consulta pública.", vacio: "No hay publicaciones disponibles." },
  "consulta-ciudadana": { titulo: "Consulta ciudadana", descripcion: "Accede a orientación e información de interés ciudadano.", vacio: "No hay avisos publicados." },
  salas: { titulo: "Programación de salas", descripcion: "Consulta la programación y disponibilidad de salas.", vacio: "No hay salas programadas." },
};

const Campo = ({ label, placeholder }: { label: string; placeholder?: string }) => (
  <label className="ojv-label">{label}<input placeholder={placeholder} className="ojv-input" /></label>
);

function puedePublicarTransparencia(rol: string | undefined, discordId: string | undefined) {
  return esPresidenteCorteSuprema(discordId) || (rol === "FISCAL" && esFiscalRegional(discordId));
}

async function publicarTransparencia(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; rol?: string; discordId?: string } | undefined;
  if (!user?.id || !puedePublicarTransparencia(user.rol, user.discordId)) return;

  const titulo = String(formData.get("titulo") ?? "").trim();
  const autor = String(formData.get("autor") ?? "").trim();
  const cuerpo = String(formData.get("cuerpo") ?? "").trim();
  const footer = String(formData.get("footer") ?? "").trim();
  if (!titulo || !autor || !cuerpo || titulo.length > 180 || autor.length > 180 || cuerpo.length > 50000 || footer.length > 1000) return;

  const archivo = formData.get("archivo");
  let archivoDatos: Buffer | undefined;
  let archivoNombre: string | undefined;
  let archivoMimeType: string | undefined;
  let archivoTamano: number | undefined;
  if (archivo instanceof File && archivo.size > 0) {
    if (archivo.size > 10 * 1024 * 1024) return;
    const extension = archivo.name.toLowerCase().split(".").pop();
    const extensionesPermitidas = ["pdf", "docx", "png", "jpg", "jpeg", "webp"];
    const tiposPermitidos = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/png", "image/jpeg", "image/webp"];
    if (!extension || !extensionesPermitidas.includes(extension) || (archivo.type && !tiposPermitidos.includes(archivo.type))) return;
    archivoDatos = Buffer.from(await archivo.arrayBuffer());
    archivoNombre = archivo.name.slice(0, 200);
    archivoMimeType = archivo.type || (extension === "pdf" ? "application/pdf" : "application/octet-stream");
    archivoTamano = archivo.size;
  }

  await prisma.publicacionTransparencia.create({
    data: { titulo, autor, cuerpo, footer: footer || null, archivoDatos, archivoNombre, archivoMimeType, archivoTamano, publicadoPorId: user.id },
  });
  revalidatePath("/portal/transparencia");
}

async function marcarNotificacionLeida(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const id = String(formData.get("id") ?? "");
  if (!userId || !id) return;
  await (prisma as any).notificacion.updateMany({ where: { id, userId }, data: { leida: true } });
  revalidatePath("/portal/notificaciones");
}

function ConsultaAudiencias({ modo }: { modo: string }) {
  const activo = (id: string) => `ojv-tab ${modo === id ? "ojv-tab-active" : ""}`;
  return <div className="ojv-card">
    <div className="ojv-tabs"><Link href="?modo=rit" className={activo("rit")}>Búsqueda por RIT</Link><Link href="?modo=fecha" className={activo("fecha")}>Búsqueda por fecha</Link><Link href="?modo=nombre" className={activo("nombre")}>Búsqueda por nombre</Link></div>
    <form className="ojv-form">
      {modo === "nombre" ? <div className="grid gap-4 md:grid-cols-4"><Campo label="Nombre" /><Campo label="Apellido paterno" /><Campo label="Apellido materno" /><Campo label="Año" placeholder="2026" /></div> : modo === "fecha" ? <div className="grid gap-4 md:grid-cols-2"><Campo label="Desde" placeholder="dd/mm/aaaa" /><Campo label="Hasta" placeholder="dd/mm/aaaa" /></div> : <div className="grid gap-4 md:grid-cols-3"><Campo label="Libro/Tipo" /><Campo label="Rol" /><Campo label="Año" placeholder="2026" /></div>}
      <div className="mt-4 grid gap-4 md:grid-cols-3"><label className="ojv-label">Competencia<select className="ojv-input"><option>Penal</option><option>Garantía</option></select></label><label className="ojv-label">Corte<select className="ojv-input"><option>Todos</option></select></label><label className="ojv-label">Tribunal<select className="ojv-input"><option>Todos</option></select></label></div>
      <div className="ojv-actions"><button className="ojv-search">Buscar</button><button type="reset" className="ojv-clear">Limpiar</button></div>
    </form>
  </div>;
}

function ConsultaCiudadana({ rol }: { rol: string }) {
  const esFuncionario = rol === "FUNCIONARIO";

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Link href="/abogados" className="ojv-card block p-5 transition hover:border-[#5b8038]">
          <p className="ojv-label">Servicio de verificación</p>
          <h2 className="mt-2 font-display text-xl text-[#12486d]">Verificar Licenciatura</h2>
          <p className="mt-2 text-sm text-grafito/55">Comprueba si un abogado se encuentra habilitado para ejercer.</p>
      </Link>
      {esFuncionario && (
        <Link href="#ordenes-captura" className="ojv-card block p-5 transition hover:border-[#5b8038]">
            <p className="ojv-label">Servicio institucional</p>
            <h2 className="mt-2 font-display text-xl text-[#12486d]">Consulta Orden de Captura</h2>
            <p className="mt-2 text-sm text-grafito/55">Consulta las órdenes de captura vigentes por nombre o RIT.</p>
        </Link>
      )}
    </div>
  );
}

export default async function PortalSectionPage({ params, searchParams }: { params: { seccion: string }; searchParams?: { modo?: string; vista?: string; q?: string } }) {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol as string | undefined;
  if (!rol) redirect("/login");

  if (params.seccion === "notificaciones") {
    const userId = (session?.user as any)?.id as string;
    const notificaciones: NotificacionVista[] = await (prisma as any).notificacion.findMany({
      where: { userId },
      orderBy: { creadaEn: "desc" },
      take: 100,
      include: { causa: { select: { rit: true, tribunal: true } } },
    });
    return (
      <DashboardShell rol={rol} titulo="Mis notificaciones">
        <div className="mx-auto max-w-5xl">
          <section className="ojv-card">
            <div className="ojv-tabs"><span className="ojv-tab ojv-tab-active">Notificaciones de mis causas</span></div>
            <div className="grid gap-3">
              {notificaciones.map((notificacion) => (
                <article key={notificacion.id} className={`border p-4 ${notificacion.leida ? "border-[#d3d9dc] bg-[#fafafa]" : "border-blue-200 bg-blue-50/50"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-700">{notificacion.titulo}</p>
                      <p className="mt-2 text-sm text-[#243b53]">{notificacion.mensaje}</p>
                      <p className="mt-2 text-xs text-grafito/50">RIT {notificacion.causa.rit} · {notificacion.creadaEn.toLocaleString("es-CL")}</p>
                    </div>
                    {!notificacion.leida && <form action={marcarNotificacionLeida}><input type="hidden" name="id" value={notificacion.id} /><button className="ojv-clear" type="submit">Marcar como leída</button></form>}
                  </div>
                </article>
              ))}
              {!notificaciones.length && <p className="text-sm text-grafito/50">No tienes notificaciones nuevas.</p>}
            </div>
          </section>
        </div>
      </DashboardShell>
    );
  }

  if (params.seccion === "transparencia") {
    const publicaciones = await prisma.publicacionTransparencia.findMany({
      orderBy: { creadoEn: "desc" },
      select: { id: true, titulo: true, autor: true, cuerpo: true, footer: true, creadoEn: true, archivoNombre: true },
    });
    const user = session?.user as { discordId?: string; rol?: string };
    const puedePublicar = puedePublicarTransparencia(user.rol, user.discordId);
    return (
      <DashboardShell rol={rol} titulo="Transparencia ciudadana">
        <div className="mx-auto max-w-5xl grid gap-5">
          {puedePublicar && (
            <section className="ojv-card">
              <div className="ojv-tabs"><span className="ojv-tab ojv-tab-active">Nueva publicación</span></div>
              <form action={publicarTransparencia} className="ojv-form grid gap-4" encType="multipart/form-data">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="ojv-label">Título<input name="titulo" required maxLength={180} className="ojv-input" /></label>
                  <label className="ojv-label">Autor<input name="autor" required maxLength={180} className="ojv-input" /></label>
                </div>
                <label className="ojv-label">Cuerpo<textarea name="cuerpo" required maxLength={50000} rows={8} className="ojv-input" /></label>
                <label className="ojv-label">Imagen o archivo adjunto (opcional)<input name="archivo" type="file" accept="image/png,image/jpeg,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="ojv-input" /><span className="font-normal text-[10px] text-grafito/45">Formatos: PNG, JPG, WEBP, PDF o DOCX. Máximo 10 MB.</span></label>
                <label className="ojv-label">Footer (opcional)<input name="footer" maxLength={1000} className="ojv-input" /></label>
                <div className="ojv-actions"><button className="ojv-search">Publicar</button></div>
              </form>
            </section>
          )}

          <section className="ojv-card">
            <div className="ojv-tabs"><span className="ojv-tab ojv-tab-active">Transparencia ciudadana</span></div>
            <div className="ojv-form grid gap-4">
              {publicaciones.map((publicacion) => (
                <article key={publicacion.id} className="border border-[#d3d9dc] bg-[#fafafa] p-4">
                  <p className="text-[11px] text-[#66813d]">Publicado el {publicacion.creadoEn.toLocaleDateString("es-CL")}</p>
                  <h2 className="mt-1 font-display text-xl text-[#12486d]">{publicacion.titulo}</h2>
                  <p className="mt-1 text-xs font-semibold text-grafito/60">Autor: {publicacion.autor}</p>
                  <p className="mt-4 whitespace-pre-wrap text-sm text-grafito/75">{publicacion.cuerpo}</p>
                  {publicacion.archivoNombre && <a href={`/api/transparencia/${publicacion.id}/archivo`} className="mt-4 inline-flex text-xs font-semibold text-[#12486d] underline">Descargar {publicacion.archivoNombre}</a>}
                  {publicacion.footer && <p className="mt-4 border-t border-[#d3d9dc] pt-3 text-xs italic text-grafito/55">{publicacion.footer}</p>}
                </article>
              ))}
              {!publicaciones.length && <p className="text-sm text-grafito/50">No hay publicaciones disponibles.</p>}
            </div>
          </section>
        </div>
      </DashboardShell>
    );
  }

  if (params.seccion === "consulta-audiencias") return <DashboardShell rol={rol} titulo="Consulta audiencias"><ConsultaAudiencias modo={["rit", "fecha", "nombre"].includes(searchParams?.modo ?? "") ? searchParams!.modo! : "rit"} /></DashboardShell>;
  if (params.seccion === "consulta-ciudadana") {
    const puedeConsultarOrdenes = rol === "FUNCIONARIO";
    const q = (searchParams?.q ?? "").trim();
    const ordenes = puedeConsultarOrdenes
      ? await prisma.ordenCaptura.findMany({
          where: {
            estado: { not: "LEVANTADA" },
            ...(q ? { OR: [
              { nombrePersona: { contains: q, mode: "insensitive" } },
              { causa: { rit: { contains: q, mode: "insensitive" } } },
            ] } : {}),
          },
          orderBy: { emitidaEn: "desc" },
          include: { causa: true },
        })
      : [];

    return (
      <DashboardShell rol={rol} titulo="Consulta ciudadana">
        <div className="mx-auto max-w-6xl">
          <ConsultaCiudadana rol={rol} />
          {puedeConsultarOrdenes && (
            <section id="ordenes-captura" className="ojv-card mt-5">
              <div className="ojv-tabs"><span className="ojv-tab ojv-tab-active">Consulta Orden de Captura</span></div>
              <div className="ojv-form">
                <p className="mb-4 text-sm text-grafito/55">Órdenes vigentes por nombre de la persona requerida o RIT de la causa.</p>
                <form method="get" className="flex flex-wrap gap-2">
                  <input type="hidden" name="vista" value="consulta" />
                  <input name="q" defaultValue={q} placeholder="Nombre o RIT" className="ojv-input min-w-[220px] flex-1" />
                  <button className="ojv-search">Buscar</button>
                  <Link href="/portal/consulta-ciudadana#ordenes-captura" className="ojv-clear">Limpiar</Link>
                </form>
                <div className="mt-5 grid gap-2">
                  {ordenes.map((orden) => (
                    <div key={orden.id} className="border border-[#d3d9dc] bg-[#fafafa] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-[#12486d]">{orden.nombrePersona}</p>
                          <p className="mt-1 text-xs text-grafito/55">RIT {orden.causa.rit}{orden.runOPasaporte ? ` · ${orden.runOPasaporte}` : ""}</p>
                        </div>
                        <a href={`/api/ordenes-captura/${orden.id}/pdf`} className="ojv-search">Ver PDF</a>
                      </div>
                      <p className="mt-2 text-xs text-grafito/55">{orden.causa.caratulado} · Emitida {orden.emitidaEn.toLocaleDateString("es-CL")}</p>
                    </div>
                  ))}
                  {!ordenes.length && <p className="text-sm text-grafito/45">No se encontraron órdenes vigentes.</p>}
                </div>
              </div>
            </section>
          )}
        </div>
      </DashboardShell>
    );
  }
  const seccion = SECCIONES[params.seccion];
  if (!seccion) notFound();
  return <DashboardShell rol={rol} titulo={seccion.titulo}><div className="mx-auto max-w-6xl"><div className="portal-message">{seccion.descripcion}</div><div className="ojv-card mt-5"><p className="text-sm text-slate-500">{seccion.vacio}</p></div></div></DashboardShell>;
}
