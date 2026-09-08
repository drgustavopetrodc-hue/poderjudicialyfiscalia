import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';

export const dynamic = 'force-dynamic';

async function buscarCausa(formData: FormData) {
  'use server';
  const q = String(formData.get('q') ?? '').trim();
  if (!q) return;
  const causa = await prisma.causa.findFirst({ where: { OR: [{ rit: q }, { ruc: q }] }, select: { id: true } });
  if (!causa) {
    redirect(`/consulta?notfound=1&q=${encodeURIComponent(q)}`);
  }
  redirect(`/causas/${causa.id}`);
}

export default async function ConsultaPage({ searchParams }: { searchParams?: { notfound?: string; q?: string } }) {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol as string | undefined;
  const notfound = Boolean(searchParams?.notfound);
  const q = searchParams?.q ?? '';

  return (
    <DashboardShell rol={rol || "INVITADO"} titulo="Consulta unificada de causas">
      <div className="mx-auto max-w-lg">
        <div className="panel-card p-6">
          <p className="eyebrow mb-2">Oficina Judicial Virtual</p>
          <h2 className="font-display text-xl mb-2">Consulta de causas</h2>
          <p className="text-sm text-grafito/55 mb-4">Busca por RIT o RUC. Las causas reservadas requieren autenticación y permisos.</p>
          {notfound && <p className="text-sm text-red-700 mb-3">No se encontró ninguna causa con ese identificador.</p>}
          <form action={buscarCausa} className="flex gap-2">
            <input name="q" defaultValue={q} placeholder="RIT o RUC" className="w-full border border-grafito/15 rounded-lg px-3 py-2" />
            <button className="button-primary">Buscar</button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
