import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import { prisma } from "@/lib/prisma";

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

function ConsultaCiudadana({ rol, vista }: { rol: string; vista: string }) {
  const esFuncionario = rol === "FUNCIONARIO";
  const activo = (id: string) => `ojv-tab ${vista === id ? "ojv-tab-active" : ""}`;

  return (
    <div className="grid gap-5">
      <div className="ojv-card">
        <div className="ojv-tabs">
          <Link href="?vista=consulta" className={activo("consulta")}>Consulta unificada</Link>
          <Link href="?vista=causas" className={activo("causas")}>Mis causas</Link>
        </div>
        {vista === "causas" ? (
          <div className="ojv-form">
            <p className="ojv-label">Mis causas</p>
            <p className="mt-2 text-sm text-grafito/55">Accede a las causas asociadas a tu usuario.</p>
            <Link href="/mis-causas" className="ojv-search mt-4 inline-flex">Ver mis causas</Link>
          </div>
        ) : (
          <form action="/consulta" method="get" className="ojv-form">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="ojv-label">Libro/Tipo<input name="q" className="ojv-input" placeholder="RIT o RUC" /></label>
              <label className="ojv-label">Rol<input className="ojv-input" /></label>
              <label className="ojv-label">Año<input className="ojv-input" placeholder="2026" /></label>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="ojv-label">Competencia<select className="ojv-input"><option>Penal</option><option>Garantía</option></select></label>
              <label className="ojv-label">Corte<select className="ojv-input"><option>Todos</option></select></label>
              <label className="ojv-label">Tribunal<select className="ojv-input"><option>Todos</option></select></label>
            </div>
            <div className="ojv-actions"><button className="ojv-search">Buscar</button><Link href="/consulta" className="ojv-clear">Consulta avanzada</Link></div>
          </form>
        )}
      </div>

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
    </div>
  );
}

export default async function PortalSectionPage({ params, searchParams }: { params: { seccion: string }; searchParams?: { modo?: string; vista?: string; q?: string } }) {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol as string | undefined;
  if (!rol) redirect("/login");

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
          <ConsultaCiudadana rol={rol} vista={searchParams?.vista === "causas" ? "causas" : "consulta"} />
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
