import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";

export const dynamic = "force-dynamic";

const SECCIONES: Record<string, { titulo: string; descripcion: string; filas: string[] }> = {
  notificaciones: { titulo: "Mis notificaciones", descripcion: "Revisa las notificaciones asociadas a tus causas y actuaciones registradas.", filas: ["No hay notificaciones nuevas."] },
  audiencias: { titulo: "Mis audiencias", descripcion: "Consulta las audiencias vinculadas a tus causas.", filas: ["No hay audiencias programadas."] },
  "estado-diario": { titulo: "Mi estado diario", descripcion: "Consulta el estado de las presentaciones y actuaciones del día.", filas: ["No hay movimientos registrados para hoy."] },
  "certificado-desempeno": { titulo: "Certificado de desempeño", descripcion: "Aquí podrás consultar y descargar tus certificados institucionales.", filas: ["No hay certificados disponibles."] },
  remates: { titulo: "Remates", descripcion: "Consulta los remates publicados por el Poder Judicial.", filas: ["No hay remates publicados."] },
  transparencia: { titulo: "Transparencia institucional", descripcion: "Información institucional, normativa y documentos públicos.", filas: ["Contenido institucional próximamente disponible."] },
  "consulta-ciudadana": { titulo: "Consulta ciudadana", descripcion: "Accede a información y servicios de orientación ciudadana.", filas: ["No hay avisos ciudadanos publicados."] },
  salas: { titulo: "Programación de salas", descripcion: "Consulta la disponibilidad y programación de salas.", filas: ["No hay salas programadas."] },
  "consulta-audiencias": { titulo: "Consulta de audiencias", descripcion: "Busca audiencias por competencia y datos de la causa.", filas: ["Selecciona una competencia para comenzar la búsqueda."] },
};

export default async function PortalSectionPage({ params }: { params: { seccion: string } }) {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol as string | undefined;
  if (!rol) redirect("/login");
  const seccion = SECCIONES[params.seccion];
  if (!seccion) notFound();

  return (
    <DashboardShell rol={rol} titulo={seccion.titulo}>
      <div className="mx-auto max-w-5xl">
        <div className="portal-message">{seccion.descripcion}</div>
        {params.seccion === "consulta-audiencias" && <div className="panel-card mt-5 p-5"><div className="grid gap-4 md:grid-cols-2"><label className="text-sm">Competencia<select className="mt-1 w-full rounded border px-3 py-2"><option>Penal</option><option>Juicio Oral en lo Penal</option></select></label><label className="text-sm">Tipo de búsqueda<select className="mt-1 w-full rounded border px-3 py-2"><option>Por RIT</option><option>Por fecha</option><option>Por nombre</option></select></label></div><div className="mt-5 flex gap-2"><button className="button-primary">Buscar</button><button className="button-outline">Limpiar</button></div></div>}
        <div className="panel-card mt-5 p-6"><div className="space-y-3">{seccion.filas.map((fila) => <div key={fila} className="rounded border border-blue-100 bg-blue-50/40 px-4 py-3 text-sm text-grafito/70">{fila}</div>)}</div></div>
      </div>
    </DashboardShell>
  );
}
