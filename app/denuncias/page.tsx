import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardShell from '@/components/DashboardShell';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ROLES_FUNCIONARIOS } from '@/lib/identidad';

export const dynamic = 'force-dynamic';

async function abrirCausaDesdeDenuncia(denunciaId: string) {
  'use server';
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const rol = (session?.user as any)?.rol as string | undefined;
  if (!userId || (rol !== 'FISCAL' && rol !== 'ADMIN')) return;

  const denuncia = await prisma.denuncia.findUnique({ where: { id: denunciaId } });
  if (!denuncia) return;

  // Generar un RIT simple y único (para propósitos de prueba)
  const rit = `DEN-${Date.now()}`;
  const caratulado = `Denuncia: ${denuncia.titulo} — ${denuncia.denuncianteId}`;
  const descripcion = `Denuncia original:\n${denuncia.descripcion}`;

  const causa = await prisma.causa.create({
    data: {
      rit,
      caratulado,
      delito: `Denuncia: ${denuncia.titulo}`,
      descripcion,
      fiscalId: userId,
    },
  });

  await prisma.denuncia.update({ where: { id: denunciaId }, data: { estado: 'RECIBIDA' } });
  redirect(`/causas/${causa.id}`);
}

export default async function DenunciasPage() {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol as string | undefined;
  if (!rol || !ROLES_FUNCIONARIOS.includes(rol)) redirect('/login');

  const denuncias = await prisma.denuncia.findMany({ orderBy: { creadaEn: 'desc' }, include: { denunciante: true } });

  return (
    <DashboardShell rol={rol ?? 'FUNCIONARIO'} titulo="Denuncias recibidas">
      <div className="mx-auto max-w-4xl">
        <div className="panel-card p-6 mb-4">
          <h2 className="font-display text-xl mb-2">Denuncias presentadas</h2>
          <p className="text-sm text-grafito/55 mb-4">Listado de denuncias presentadas por la comunidad.</p>
          <div className="space-y-3">
            {denuncias.map((d) => (
              <div key={d.id} className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-marino-950">{d.titulo}</p>
                    <p className="mt-1 text-sm font-semibold text-[#12486d]">Delitos denunciados: {d.delitos || 'No informados'}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-grafito/70">{d.descripcion}</p>
                    <p className="mt-2 text-xs text-grafito/50">Presentada por: {d.denunciante?.nombreIC || d.denunciante?.name || 'Usuario anónimo'} · {d.creadaEn.toISOString().slice(0,19).replace('T',' ')}</p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col gap-2">
                    {(rol === 'FISCAL' || rol === 'ADMIN') && (
                      <Link href={`/causas/nueva?fromDenunciaId=${d.id}`} className="button-primary">Elevar a causa</Link>
                    )}
                    <span className="text-xs text-grafito/50">Estado: {d.estado}</span>
                  </div>
                </div>
              </div>
            ))}
            {!denuncias.length && <p className="text-sm text-grafito/45">No hay denuncias registradas.</p>}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
