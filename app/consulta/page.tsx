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
      <div className="mx-auto max-w-lg">
        <div className="panel-card p-6">
          <p className="eyebrow mb-2">Consulta de causas</p>
          <div className="mb-5 flex flex-wrap border-b border-grafito/10">
            <a href="/consulta?modo=rit" className={`px-4 py-2 text-sm ${modo === "rit" ? "border-b-2 border-[#587f2d] font-semibold text-[#587f2d]" : "text-grafito/50"}`}>Búsqueda por RIT</a>
            <a href="/consulta?modo=nombre" className={`px-4 py-2 text-sm ${modo === "nombre" ? "border-b-2 border-[#587f2d] font-semibold text-[#587f2d]" : "text-grafito/50"}`}>Búsqueda por Nombre</a>
          </div>
          <p className="text-sm text-grafito/55 mb-4">Las causas públicas pueden consultarse sin iniciar sesión.</p>
          {notfound && <p className="text-sm text-red-700 mb-3">No se encontró ninguna causa con ese identificador.</p>}
          <form action={buscarCausa} className="grid gap-3">
            {modo === "rit" ? <input name="q" defaultValue={q} placeholder="RIT o RUC" className="w-full border border-grafito/15 rounded-lg px-3 py-2" /> : <div className="grid gap-3 sm:grid-cols-3"><input name="nombre" placeholder="Nombre" className="border border-grafito/15 rounded-lg px-3 py-2" /><input name="apellidoPaterno" placeholder="Apellido paterno" className="border border-grafito/15 rounded-lg px-3 py-2" /><input name="apellidoMaterno" placeholder="Apellido materno" className="border border-grafito/15 rounded-lg px-3 py-2" /></div>}
            <select name="competencia" className="w-full border border-grafito/15 rounded-lg px-3 py-2"><option>Corte Suprema</option><option>Corte de Apelaciones</option><option>Penal</option></select>
            <button className="button-primary">Buscar</button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
