import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import { ROLES_FUNCIONARIOS } from '@/lib/identidad';

export const dynamic = 'force-dynamic';

export default async function OrdenesCapturaPage({ searchParams }: { searchParams?: { q?: string } }) {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol as string | undefined;
  if (!rol || !ROLES_FUNCIONARIOS.includes(rol)) redirect('/login');

  const q = (searchParams?.q ?? '').trim();
  const baseWhere: any = { estado: { not: 'LEVANTADA' } };
  if (q) {
    baseWhere.AND = [
      { OR: [
        { nombrePersona: { contains: q, mode: 'insensitive' } },
        { runOPasaporte: q },
      ] },
    ];
  }

  const ordenes = await prisma.ordenCaptura.findMany({ where: baseWhere, orderBy: { emitidaEn: 'desc' }, include: { causa: true, solicitadoPor: true } });

  return (
    <DashboardShell rol={rol ?? 'FUNCIONARIO'} titulo="Órdenes de captura">
      <div className="mx-auto max-w-4xl">
        <div className="panel-card p-6 mb-4">
          <h2 className="font-display text-xl mb-2">Buscar órdenes de captura</h2>
          <p className="text-sm text-grafito/55 mb-4">Filtra por nombre de persona o RUN/pasaporte.</p>
          <form method="get" className="flex gap-2">
            <input name="q" defaultValue={q} placeholder="Nombre o RUN" className="w-full border border-grafito/15 rounded-lg px-3 py-2" />
            <button className="button-primary">Buscar</button>
          </form>
        </div>

        <div className="space-y-3">
          {ordenes.map((o) => (
            <div key={o.id} className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-marino-950">{o.nombrePersona} {o.runOPasaporte ? `· ${o.runOPasaporte}` : ''}</p>
                  <p className="text-sm text-grafito/55">Causa: <a href={`/causas/${o.causaId}`} className="underline">{o.causa.caratulado}</a></p>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`/api/ordenes-captura/${o.id}/pdf`} className="button-primary">Ver PDF</a>
                </div>
              </div>
              <p className="mt-2 text-sm text-grafito/65">Emitida: {o.emitidaEn.toISOString().slice(0, 19).replace('T', ' ')}</p>
              <p className="mt-2 text-sm text-grafito/55">Solicitada por: {o.solicitadoPor?.name ?? '—'}</p>
            </div>
          ))}
          {!ordenes.length && <p className="text-sm text-grafito/45">No se encontraron órdenes.</p>}
        </div>
      </div>
    </DashboardShell>
  );
}
