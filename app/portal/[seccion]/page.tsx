import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

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
      <div className="mt-4 grid gap-4 md:grid-cols-3"><label className="ojv-label">Competencia<select className="ojv-input"><option>Penal</option><option>Juicio Oral en lo Penal</option></select></label><label className="ojv-label">Corte<select className="ojv-input"><option>Todos</option></select></label><label className="ojv-label">Tribunal<select className="ojv-input"><option>Todos</option></select></label></div>
      <div className="ojv-actions"><button className="ojv-search">Buscar</button><button type="reset" className="ojv-clear">Limpiar</button></div>
    </form>
  </div>;
}

export default async function PortalSectionPage({ params, searchParams }: { params: { seccion: string }; searchParams?: { modo?: string } }) {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol as string | undefined;
  if (!rol) redirect("/login");

  if (params.seccion === "consulta-audiencias") return <DashboardShell rol={rol} titulo="Consulta audiencias"><ConsultaAudiencias modo={["rit", "fecha", "nombre"].includes(searchParams?.modo ?? "") ? searchParams!.modo! : "rit"} /></DashboardShell>;
  const seccion = SECCIONES[params.seccion];
  if (!seccion) notFound();
  return <DashboardShell rol={rol} titulo={seccion.titulo}><div className="mx-auto max-w-6xl"><div className="portal-message">{seccion.descripcion}</div><div className="ojv-card mt-5"><p className="text-sm text-slate-500">{seccion.vacio}</p></div></div></DashboardShell>;
}
