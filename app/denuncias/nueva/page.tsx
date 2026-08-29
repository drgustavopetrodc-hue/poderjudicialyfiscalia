import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';

export const dynamic = 'force-dynamic';

async function crearDenuncia(formData: FormData) {
  'use server';
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect('/login');

  const titulo = String(formData.get('titulo') ?? '').trim();
  const descripcion = String(formData.get('descripcion') ?? '').trim();
  if (!titulo || !descripcion) return;

  await prisma.denuncia.create({ data: { titulo, descripcion, denuncianteId: userId } });
  redirect('/denuncias?nueva=ok');
}

export default function NuevaDenunciaPage() {
  return (
    <DashboardShell rol="CIUDADANO" titulo="Presentar denuncia">
      <div className="mx-auto max-w-lg">
        <div className="panel-card p-6">
          <h2 className="font-display text-xl mb-2">Presentar denuncia</h2>
          <p className="text-sm text-grafito/55 mb-4">Rellena el formulario con los antecedentes que desees denunciar.</p>
          <form action={crearDenuncia} className="grid gap-3">
            <div>
              <label className="block text-xs text-grafito/55 mb-1">Título</label>
              <input name="titulo" required placeholder="Título breve" className="w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-grafito/55 mb-1">Descripción</label>
              <textarea name="descripcion" required rows={6} placeholder="Describe los hechos..." className="w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm" />
            </div>
            <button className="button-primary">Enviar denuncia</button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
