import { prisma } from '@/lib/prisma';
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

export default function ConsultaPage({ searchParams }: { searchParams?: { notfound?: string; q?: string } }) {
  const notfound = Boolean(searchParams?.notfound);
  const q = searchParams?.q ?? '';

  return (
    <DashboardShell rol="CIUDADANO" titulo="Consulta pública de causas">
      <div className="mx-auto max-w-lg">
        <div className="panel-card p-6">
          <h2 className="font-display text-xl mb-2">Buscar expediente por RIT o RUC</h2>
          <p className="text-sm text-grafito/55 mb-4">Ingresa el número de RIT (ej: 001-2026) o RUC para consultar un expediente público.</p>
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
