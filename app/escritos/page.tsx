import { getServerSession } from "next-auth";
import { nombreLegal } from "@/lib/identidad";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import DashboardShell from "@/components/DashboardShell";
import Link from "next/link";
import { format } from "date-fns";
import { ScrollText, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

const ROLES_CON_ACCESO = ["ADMIN", "JUEZ", "FISCAL", "ABOGADO"];

async function presentarEscrito(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const autorId = (session?.user as any)?.id as string;
  const rol = (session?.user as any)?.rol;
  if (!autorId || (rol !== "FISCAL" && rol !== "ABOGADO" && rol !== "ADMIN")) return;

  const causaId = String(formData.get("causaId"));
  if (!causaId) return;

  await prisma.escrito.create({
    data: {
      causaId,
      autorId,
      tipo: String(formData.get("tipo")) as any,
      titulo: String(formData.get("titulo")),
      contenido: String(formData.get("contenido")),
    },
  });
  revalidatePath("/escritos");
}

export default async function EscritosPage() {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol as string | undefined;
  const userId = (session?.user as any)?.id as string | undefined;

  if (!rol || !ROLES_CON_ACCESO.includes(rol)) {
    redirect("/dashboard?error=sin-permiso");
  }

  const puedePresentar = rol === "FISCAL" || rol === "ABOGADO" || rol === "ADMIN";

  // Causas donde la persona puede presentar un escrito: donde es el fiscal
  // asignado, o donde tiene una defensa activa.
  const causasDisponibles = puedePresentar
    ? await prisma.causa.findMany({
        where: {
          OR: [
            { fiscalId: userId },
            { defensas: { some: { abogadoId: userId, activa: true } } },
            ...(rol === "ADMIN" ? [{}] : []),
          ],
        },
        select: { id: true, rit: true, caratulado: true },
        orderBy: { creadaEn: "desc" },
      })
    : [];

  const escritos = await prisma.escrito.findMany({
    orderBy: { presentadoEn: "desc" },
    include: { autor: true, causa: { select: { id: true, rit: true, caratulado: true } } },
    take: 100,
  });

  return (
    <DashboardShell rol={rol} titulo="Escritos presentados al tribunal">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <p className="eyebrow flex items-center gap-1.5"><ScrollText size={12} /> Mesa de partes</p>
          <h2 className="font-display text-3xl text-marino-950 mt-1">Escritos</h2>
          <p className="mt-1 text-sm text-grafito/55">Registro cronológico de todo lo presentado ante el tribunal.</p>
        </div>

        {puedePresentar && (
          <form action={presentarEscrito} className="panel-card p-6 mb-8 grid gap-3">
            <h3 className="font-display text-lg mb-1 text-marino-950">Presentar un nuevo escrito</h3>
            <div className="flex gap-3">
              <select name="causaId" required className="flex-1 border border-grafito/15 rounded-lg px-3 py-2 text-sm bg-hueso/40">
                <option value="">Selecciona la causa...</option>
                {causasDisponibles.map((c) => (
                  <option key={c.id} value={c.id}>
                    RIT {c.rit} — {c.caratulado}
                  </option>
                ))}
              </select>
              <select name="tipo" className="border border-grafito/15 rounded-lg px-3 py-2 text-sm bg-hueso/40">
                <option value="QUERELLA">Querella</option>
                <option value="FORMALIZACION">Formalización</option>
                <option value="ACUSACION">Acusación</option>
                <option value="CONTESTACION">Contestación</option>
                <option value="PRUEBA">Prueba</option>
                <option value="RECURSO">Recurso</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <input name="titulo" required placeholder="Título del escrito" className="border border-grafito/15 rounded-lg px-3 py-2 text-sm" />
            <textarea name="contenido" required rows={4} placeholder="Contenido..." className="border border-grafito/15 rounded-lg px-3 py-2 text-sm" />
            <button className="button-primary justify-self-start">Presentar escrito</button>
            {causasDisponibles.length === 0 && (
              <p className="text-xs text-grafito/40">
                No tienes causas asignadas todavía, así que no hay dónde presentar un escrito.
              </p>
            )}
          </form>
        )}

        <div className="grid gap-3">
          {escritos.map((e) => (
            <div key={e.id} className="panel-card p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText size={14} className="text-blue-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-mono text-grafito/40 uppercase mb-1">
                    {e.tipo} · {nombreLegal(e.autor)} · {format(e.presentadoEn, "dd/MM/yyyy HH:mm")}
                  </p>
                  <Link href={`/causas/${e.causa.id}`} className="font-semibold text-marino-950 hover:underline">
                    {e.titulo}
                  </Link>
                  <p className="text-xs text-grafito/40 mb-2">
                    RIT {e.causa.rit} — {e.causa.caratulado}
                  </p>
                  <p className="text-sm text-grafito/60 whitespace-pre-wrap leading-relaxed">{e.contenido}</p>
                </div>
              </div>
            </div>
          ))}
          {escritos.length === 0 && (
            <div className="rounded-2xl border border-dashed border-grafito/20 bg-white p-12 text-center text-sm text-grafito/50">
              Aún no hay escritos presentados.
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
