import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MiFiscaliaShell from "@/components/MiFiscaliaShell";

export const dynamic = "force-dynamic";

async function crearDenuncia(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect("/ovj");

  const titulo = String(formData.get("titulo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  if (!titulo || !descripcion) return;

  await prisma.denuncia.create({
    data: {
      titulo,
      descripcion,
      denuncianteId: userId,
      estado: "RECIBIDA",
    },
  });

  redirect("/mi-fiscalia/denuncias?ok=1");
}

export default async function MiFiscaliaDenunciasPage({
  searchParams,
}: {
  searchParams?: { tab?: string; ok?: string };
}) {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol as string | undefined;
  const tab = searchParams?.tab === "gestionar" ? "gestionar" : "presentar";
  const ok = Boolean(searchParams?.ok);

  const denuncias = await prisma.denuncia.findMany({
    orderBy: { creadaEn: "desc" },
    include: { denunciante: true },
  });

  return (
    <MiFiscaliaShell title="Denuncias" rol={rol ?? "CIUDADANO"}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 overflow-hidden rounded-2xl border border-[#dfe7ee] bg-white shadow-sm">
          <div className="flex border-b border-[#dfe7ee] bg-[#edf5f9]">
            <a
              href="/mi-fiscalia/denuncias?tab=presentar"
              className={`flex-1 px-4 py-3 text-center text-sm font-semibold transition ${
                tab === "presentar" ? "bg-[#0f5e8d] text-white" : "text-[#12314d] hover:bg-white"
              }`}
            >
              Presentar denuncias
            </a>
            <a
              href="/mi-fiscalia/denuncias?tab=gestionar"
              className={`flex-1 px-4 py-3 text-center text-sm font-semibold transition ${
                tab === "gestionar" ? "bg-[#0f5e8d] text-white" : "text-[#12314d] hover:bg-white"
              }`}
            >
              Gestionar denuncias
            </a>
          </div>

          {tab === "presentar" ? (
            <div className="p-6">
              <h2 className="mb-2 text-2xl font-black text-[#12314d]">Presentar denuncia</h2>
              <p className="mb-5 text-sm text-[#516777]">
                Completa el formulario y registra la denuncia en la fiscalía.
              </p>
              {ok && <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">Denuncia registrada correctamente.</p>}
              <form action={crearDenuncia} className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-[#21415e]">Título</label>
                  <input name="titulo" required placeholder="Ej: Robo en comuna..." className="w-full rounded-lg border border-[#dfe7ee] bg-[#f9fbfd] px-3 py-2.5 outline-none focus:border-[#0f5e8d]" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-[#21415e]">Descripción</label>
                  <textarea name="descripcion" required rows={7} placeholder="Describe los hechos, fecha, lugar y detalle relevante..." className="w-full rounded-lg border border-[#dfe7ee] bg-[#f9fbfd] px-3 py-2.5 outline-none focus:border-[#0f5e8d]" />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button className="rounded-lg bg-[#0f5e8d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0a4e79]">
                    Enviar denuncia
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-6">
              <h2 className="mb-2 text-2xl font-black text-[#12314d]">Gestionar denuncias</h2>
              <p className="mb-5 text-sm text-[#516777]">
                Esta sección solo es accesible para fiscales.
              </p>

              {!rol || !["FISCAL", "ADMIN"].includes(rol) ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  No tienes permisos para gestionar denuncias.
                </div>
              ) : (
                <div className="space-y-4">
                  {denuncias.length === 0 ? (
                    <p className="text-sm text-[#516777]">No hay denuncias registradas.</p>
                  ) : (
                    denuncias.map((denuncia) => (
                      <div key={denuncia.id} className="rounded-xl border border-[#dfe7ee] bg-[#f9fbfd] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0f5e8d]">{denuncia.estado}</p>
                            <h3 className="mt-1 text-xl font-black text-[#12314d]">{denuncia.titulo}</h3>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-[#4f6377]">{denuncia.descripcion}</p>
                          </div>
                          <div className="rounded-full bg-[#dfe85d] px-3 py-1 text-xs font-bold uppercase text-[#0a2d46]">
                            {denuncia.denunciante?.nombreIC ?? "Usuario"}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MiFiscaliaShell>
  );
}
