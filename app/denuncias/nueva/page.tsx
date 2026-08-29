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

  // Crear denuncia y adjuntos si los hay (adjuntos pequeños se guardan en DB como Bytes)
  const archivos = formData.getAll('archivos') as File[];
  const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

  const created = await prisma.denuncia.create({
    data: {
      titulo,
      descripcion,
      denuncianteId: userId,
      adjuntos: { create: [] },
    },
  });

  // Procesar archivos en serie (para evitar picos de memoria)
  for (const f of archivos) {
    if (!(f instanceof File)) continue;
    try {
      const buffer = Buffer.from(await f.arrayBuffer());
      const tipo = f.type.startsWith('image/') ? 'IMAGEN' : 'VIDEO';
      if (buffer.length > MAX_BYTES) {
        console.warn('Archivo demasiado grande, omitido:', f.name);
        continue;
      }
      await prisma.denunciaAdjunto.create({
        data: {
          denunciaId: created.id,
          subidoPorId: userId,
          tipo: tipo as any,
          nombre: f.name.slice(0, 200),
          mimeType: f.type || 'application/octet-stream',
          tamano: buffer.length,
          datos: buffer,
        },
      });
    } catch (err) {
      console.warn('No se pudo procesar archivo de denuncia:', err);
    }
  }

  redirect('/denuncias?nueva=ok');
}

export default function NuevaDenunciaPage() {
  return (
    <DashboardShell rol="CIUDADANO" titulo="Presentar denuncia">
      <div className="mx-auto max-w-lg">
        <div className="panel-card p-6">
          <h2 className="font-display text-xl mb-2">Presentar denuncia</h2>
          <p className="text-sm text-grafito/55 mb-4">Rellena el formulario con los antecedentes que desees denunciar.</p>
          <form action={crearDenuncia} className="grid gap-3" encType="multipart/form-data">
            <div>
              <label className="block text-xs text-grafito/55 mb-1">Título</label>
              <input name="titulo" required placeholder="Título breve" className="w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-grafito/55 mb-1">Descripción</label>
              <textarea name="descripcion" required rows={6} placeholder="Describe los hechos..." className="w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-grafito/55 mb-1">Adjuntar fotos o videos (cada archivo hasta 5MB)</label>
              <input type="file" name="archivos" multiple accept="image/*,video/*" className="w-full text-sm" />
            </div>
            <button className="button-primary">Enviar denuncia</button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
