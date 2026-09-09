import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';

export const dynamic = 'force-dynamic';

async function buscarCausa(formData: FormData) {
  'use server';
  const q = String(formData.get('q') ?? '').trim();
  const nombre = ["nombre", "apellidoPaterno", "apellidoMaterno"].map((campo) => String(formData.get(campo) ?? '').trim()).filter(Boolean).join(" ");
  const termino = q || nombre;
  if (!termino) return;
  const causa = await prisma.causa.findFirst({ where: q ? { OR: [{ rit: q }, { ruc: q }] } : { caratulado: { contains: termino, mode: "insensitive" } }, select: { id: true } });
  if (!causa) {
    redirect(`/consulta?notfound=1&q=${encodeURIComponent(termino)}`);
  }
  redirect(`/causas/${causa.id}`);
}

export default async function ConsultaPage({ searchParams }: { searchParams?: { notfound?: string; q?: string; modo?: string } }) {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol as string | undefined;
  const notfound = Boolean(searchParams?.notfound);
  const q = searchParams?.q ?? '';
  const modo = searchParams?.modo === "nombre" ? "nombre" : "rit";

  return (
    <DashboardShell rol={rol || "INVITADO"} titulo="Consulta unificada de causas">
      <div className="mx-auto max-w-6xl">
        <div className="ojv-card">
          <div className="ojv-tabs">
            <a href="/consulta?modo=rit" className={`ojv-tab ${modo === "rit" ? "ojv-tab-active" : ""}`}>Búsqueda por RIT</a>
            <a href="/consulta?modo=nombre" className={`ojv-tab ${modo === "nombre" ? "ojv-tab-active" : ""}`}>Búsqueda por nombre</a>
          </div>
          <p className="mt-4 text-sm text-grafito/55">Las causas públicas pueden consultarse sin iniciar sesión.</p>
          {notfound && <p className="text-sm text-red-700 mb-3">No se encontró ninguna causa con ese identificador.</p>}
          <form action={buscarCausa} className="ojv-form">
            {modo === "rit" ? <div className="grid gap-4 md:grid-cols-3"><label className="ojv-label">Libro/Tipo<input name="q" defaultValue={q} placeholder="RIT o RUC" className="ojv-input" /></label><label className="ojv-label">Rol<input className="ojv-input" /></label><label className="ojv-label">Año<input className="ojv-input" placeholder="2026" /></label></div> : <div className="grid gap-4 md:grid-cols-4"><label className="ojv-label">Nombre<input name="nombre" className="ojv-input" /></label><label className="ojv-label">Apellido paterno<input name="apellidoPaterno" className="ojv-input" /></label><label className="ojv-label">Apellido materno<input name="apellidoMaterno" className="ojv-input" /></label><label className="ojv-label">Año<input className="ojv-input" placeholder="2026" /></label></div>}
            <div className="mt-4 grid gap-4 md:grid-cols-3"><label className="ojv-label">Competencia<select name="competencia" className="ojv-input"><option>Corte Suprema</option><option>Corte de Apelaciones</option><option>Penal</option></select></label><label className="ojv-label">Corte<select className="ojv-input"><option>Seleccione Corte...</option></select></label><label className="ojv-label">Tribunal<select className="ojv-input"><option>Seleccione Tribunal...</option></select></label></div>
            <div className="ojv-actions"><button className="ojv-search">Buscar</button><button type="reset" className="ojv-clear">Limpiar</button></div>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
