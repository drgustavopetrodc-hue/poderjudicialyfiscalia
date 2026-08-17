import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";


export const dynamic = "force-dynamic";
async function presentarEscrito(causaId: string, formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const autorId = (session?.user as any)?.id as string;
  if (!autorId) return;

  await prisma.escrito.create({
    data: {
      causaId,
      autorId,
      tipo: String(formData.get("tipo")) as any,
      titulo: String(formData.get("titulo")),
      contenido: String(formData.get("contenido")),
    },
  });
  revalidatePath(`/causas/${causaId}`);
}

async function asumirDefensa(causaId: string) {
  "use server";
  const session = await getServerSession(authOptions);
  const abogadoId = (session?.user as any)?.id as string;
  const rol = (session?.user as any)?.rol;
  if (!abogadoId || rol !== "ABOGADO") return;

  const cert = await prisma.certificacionAbogado.findUnique({ where: { userId: abogadoId } });
  if (!cert || cert.estado !== "APROBADA") return;

  await prisma.defensa.create({ data: { causaId, abogadoId } });
  revalidatePath(`/causas/${causaId}`);
}

async function dictarSentencia(causaId: string, juezId: string, formData: FormData) {
  "use server";
  await prisma.sentencia.create({
    data: {
      causaId,
      juezId,
      resultado: String(formData.get("resultado")) as any,
      fundamento: String(formData.get("fundamento")),
      pena: String(formData.get("pena") ?? ""),
    },
  });
  await prisma.causa.update({ where: { id: causaId }, data: { estado: "SENTENCIADA" } });
  revalidatePath(`/causas/${causaId}`);
}

export default async function CausaDetallePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string;
  const rol = (session?.user as any)?.rol as string;

  const causa = await prisma.causa.findUnique({
    where: { id: params.id },
    include: {
      fiscal: true,
      juez: true,
      partes: { include: { user: true } },
      defensas: { where: { activa: true }, include: { abogado: true } },
      escritos: { include: { autor: true }, orderBy: { presentadoEn: "desc" } },
      audiencias: { orderBy: { fechaHora: "asc" } },
      sentencia: true,
    },
  });

  if (!causa) notFound();

  const esJuezDeLaCausa = causa.juezId === userId;
  const puedeDictarSentencia = esJuezDeLaCausa && causa.estado === "EN_JUICIO" && !causa.sentencia;
  const puedeAsumirDefensa = rol === "ABOGADO" && !causa.defensas.some((d) => d.abogadoId === userId);

  return (
    <main className="min-h-screen bg-hueso px-8 py-12 max-w-3xl mx-auto">
      <p className="font-mono text-xs text-grafito/40 uppercase tracking-widest mb-2">RIT {causa.rit}</p>
      <div className="flex justify-between items-start mb-8">
        <h1 className="font-display text-3xl">{causa.caratulado}</h1>
        <span className="text-xs font-mono uppercase bg-marino-950 text-hueso px-3 py-1.5 rounded-sm shrink-0">
          {causa.estado.replace(/_/g, " ")}
        </span>
      </div>

      <section className="bg-white border border-grafito/10 rounded-sm p-6 mb-6">
        <p className="text-sm text-grafito/50 mb-1">Delito</p>
        <p className="mb-4">{causa.delito}</p>
        <p className="text-sm text-grafito/50 mb-1">Descripción</p>
        <p className="mb-4 whitespace-pre-wrap">{causa.descripcion}</p>
        <p className="text-sm text-grafito/50">
          Fiscal: {causa.fiscal.name} · Juez: {causa.juez?.name ?? "Sin asignar"}
        </p>
      </section>

      {/* Defensa técnica */}
      <section className="bg-white border border-grafito/10 rounded-sm p-6 mb-6">
        <h2 className="font-display text-xl mb-3">Defensa técnica</h2>
        {causa.defensas.length === 0 ? (
          <p className="text-grafito/50 text-sm mb-3">Aún no hay abogado defensor asignado.</p>
        ) : (
          <ul className="text-sm mb-3">
            {causa.defensas.map((d) => (
              <li key={d.id}>{d.abogado.name}</li>
            ))}
          </ul>
        )}
        {puedeAsumirDefensa && (
          <form action={asumirDefensa.bind(null, causa.id)}>
            <button className="bg-marino-950 text-hueso px-4 py-2 rounded-sm text-sm hover:bg-marino-900">
              Asumir defensa
            </button>
          </form>
        )}
      </section>

      {/* Escritos */}
      <section className="bg-white border border-grafito/10 rounded-sm p-6 mb-6">
        <h2 className="font-display text-xl mb-3">Escritos presentados</h2>
        <div className="grid gap-3 mb-5">
          {causa.escritos.map((e) => (
            <div key={e.id} className="border-t border-grafito/10 pt-3 first:border-t-0 first:pt-0">
              <p className="text-xs font-mono text-grafito/40 uppercase">
                {e.tipo} · {e.autor.name} · {format(e.presentadoEn, "dd/MM/yyyy HH:mm")}
              </p>
              <p className="font-semibold">{e.titulo}</p>
              <p className="text-sm text-grafito/60 whitespace-pre-wrap">{e.contenido}</p>
            </div>
          ))}
          {causa.escritos.length === 0 && <p className="text-grafito/50 text-sm">Sin escritos aún.</p>}
        </div>

        {session && (
          <form action={presentarEscrito.bind(null, causa.id)} className="grid gap-3 border-t border-grafito/10 pt-4">
            <div className="flex gap-3">
              <select name="tipo" className="border border-grafito/20 rounded-sm px-3 py-2 text-sm">
                <option value="QUERELLA">Querella</option>
                <option value="FORMALIZACION">Formalización</option>
                <option value="ACUSACION">Acusación</option>
                <option value="CONTESTACION">Contestación</option>
                <option value="PRUEBA">Prueba</option>
                <option value="RECURSO">Recurso</option>
                <option value="OTRO">Otro</option>
              </select>
              <input name="titulo" required placeholder="Título del escrito" className="flex-1 border border-grafito/20 rounded-sm px-3 py-2 text-sm" />
            </div>
            <textarea name="contenido" required rows={4} placeholder="Contenido..." className="border border-grafito/20 rounded-sm px-3 py-2 text-sm" />
            <button className="bg-marino-950 text-hueso px-4 py-2 rounded-sm text-sm hover:bg-marino-900 justify-self-start">
              Presentar escrito
            </button>
          </form>
        )}
      </section>

      {/* Audiencias */}
      <section className="bg-white border border-grafito/10 rounded-sm p-6 mb-6">
        <h2 className="font-display text-xl mb-3">Audiencias</h2>
        {causa.audiencias.length === 0 ? (
          <p className="text-grafito/50 text-sm">Sin audiencias programadas.</p>
        ) : (
          <ul className="text-sm grid gap-2">
            {causa.audiencias.map((a) => (
              <li key={a.id} className="flex justify-between border-t border-grafito/10 pt-2 first:border-t-0 first:pt-0">
                <span>{a.tipo.replace(/_/g, " ")}</span>
                <span className="text-grafito/50">{format(a.fechaHora, "dd/MM/yyyy HH:mm")}</span>
                <span className="font-mono text-xs uppercase">{a.estado}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Sentencia */}
      <section className="bg-white border border-grafito/10 rounded-sm p-6">
        <h2 className="font-display text-xl mb-3">Sentencia</h2>
        {causa.sentencia ? (
          <div>
            <p className="font-mono text-xs uppercase text-grafito/40 mb-1">{causa.sentencia.resultado}</p>
            <p className="whitespace-pre-wrap mb-2">{causa.sentencia.fundamento}</p>
            {causa.sentencia.pena && <p className="text-sm text-grafito/60">Pena: {causa.sentencia.pena}</p>}
          </div>
        ) : puedeDictarSentencia ? (
          <form action={dictarSentencia.bind(null, causa.id, userId)} className="grid gap-3">
            <select name="resultado" className="border border-grafito/20 rounded-sm px-3 py-2 text-sm">
              <option value="CONDENATORIA">Condenatoria</option>
              <option value="ABSOLUTORIA">Absolutoria</option>
            </select>
            <textarea name="fundamento" required rows={4} placeholder="Fundamento de la sentencia..." className="border border-grafito/20 rounded-sm px-3 py-2 text-sm" />
            <input name="pena" placeholder="Pena (si corresponde)" className="border border-grafito/20 rounded-sm px-3 py-2 text-sm" />
            <button className="bg-marino-950 text-hueso px-4 py-2 rounded-sm text-sm hover:bg-marino-900 justify-self-start">
              Dictar sentencia
            </button>
          </form>
        ) : (
          <p className="text-grafito/50 text-sm">Aún no se ha dictado sentencia.</p>
        )}
      </section>
    </main>
  );
}
