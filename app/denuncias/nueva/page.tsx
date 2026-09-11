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
  const rol = (session?.user as any)?.rol as string | undefined;
  if (!userId) redirect('/login');

  const victimaNombre = String(formData.get('victimaNombre') ?? '').trim();
  const victimaRut = String(formData.get('victimaRut') ?? '').trim();
  const delitos = String(formData.get('delitos') ?? '').trim();
  const victimarioNombre = String(formData.get('victimarioNombre') ?? '').trim();
  const victimarioRut = String(formData.get('victimarioRut') ?? '').trim();
  const caracteristicasVictimario = String(formData.get('caracteristicasVictimario') ?? '').trim();
  const lugarHechos = String(formData.get('lugarHechos') ?? '').trim();
  if (!victimaNombre || !victimaRut || !delitos || !lugarHechos) return;
  const titulo = `Denuncia Fácil: ${victimaNombre}`;
  const descripcion = `Víctima: ${victimaNombre}\nRUT víctima: ${victimaRut}\nVictimario: ${victimarioNombre || 'No conocido'}\nRUT victimario: ${victimarioRut || 'No informado'}\nCaracterísticas visuales: ${caracteristicasVictimario || 'No informadas'}\nLugar de los hechos: ${lugarHechos}`;

  // Crear denuncia y adjuntos si los hay (adjuntos pequeños se guardan en DB como Bytes)
  const archivos = formData.getAll('archivos') as File[];
  const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

  const created = await prisma.denuncia.create({
    data: {
      titulo,
      delitos,
      descripcion,
      victimaNombre,
      victimaRut,
      victimarioNombre: victimarioNombre || null,
      victimarioRut: victimarioRut || null,
      caracteristicasVictimario: caracteristicasVictimario || null,
      lugarHechos,
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

export default async function NuevaDenunciaPage() {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol as string | undefined;
  return (
    <DashboardShell rol={rol || "CIUDADANO"} titulo="Denuncia Fácil">
      <div className="mx-auto max-w-lg">
        <div className="panel-card p-6">
          <h2 className="font-display text-xl mb-2">Denuncia Fácil</h2>
          <p className="text-sm text-grafito/55 mb-4">Entrega los antecedentes esenciales para que Fiscalía pueda revisar la denuncia.</p>
          <form action={crearDenuncia} className="grid gap-3" encType="multipart/form-data">
            <label className="block text-xs text-grafito/55">Nombre de la víctima<input name="victimaNombre" required className="mt-1 w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm" /></label>
            <label className="block text-xs text-grafito/55">RUT de la víctima<input name="victimaRut" required className="mt-1 w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm" /></label>
            <label className="block text-xs text-grafito/55">Delitos denunciados<textarea name="delitos" required rows={4} placeholder="Indica los delitos que se denuncian" className="mt-1 w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm" /></label>
            <label className="block text-xs text-grafito/55">Nombre del victimario, si se conoce<input name="victimarioNombre" className="mt-1 w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm" /></label>
            <label className="block text-xs text-grafito/55">RUT del victimario, si se conoce<input name="victimarioRut" className="mt-1 w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm" /></label>
            <label className="block text-xs text-grafito/55">Características visuales del victimario<textarea name="caracteristicasVictimario" rows={4} className="mt-1 w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm" /></label>
            <label className="block text-xs text-grafito/55">Lugar de los hechos<input name="lugarHechos" required className="mt-1 w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm" /></label>
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
