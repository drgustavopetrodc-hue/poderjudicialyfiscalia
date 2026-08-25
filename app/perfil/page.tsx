import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import DashboardShell from "@/components/DashboardShell";
import { ROLES_FUNCIONARIOS, INSTITUCION_POR_ROL, identidadCompleta } from "@/lib/identidad";
import { Fingerprint, Download, AlertCircle, Gamepad2 } from "lucide-react";

export const dynamic = "force-dynamic";

async function guardarPerfil(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string;
  if (!userId) return;

  const nombreIC = String(formData.get("nombreIC") ?? "").trim();
  const rut = String(formData.get("rut") ?? "").trim();
  const nacionalidad = String(formData.get("nacionalidad") ?? "").trim();
  const institucion = String(formData.get("institucion") ?? "").trim();
  const robloxUsername = String(formData.get("robloxUsername") ?? "").trim();

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        nombreIC: nombreIC || null,
        rut: rut || null,
        nacionalidad: nacionalidad || null,
        institucion: institucion || null,
        robloxUsername: robloxUsername || null,
      },
    });
  } catch (error) {
    // Lo más probable: el RUT ya está registrado por otro usuario (es único).
    console.warn("No se pudo guardar el perfil (¿RUT duplicado?):", error);
    redirect("/perfil?error=rut-duplicado");
  }

  revalidatePath("/perfil");
  revalidatePath("/dashboard");
}

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string;
  const rol = (session?.user as any)?.rol as string;
  if (!userId) redirect("/login");

  const usuario = await prisma.user.findUnique({ where: { id: userId } });
  if (!usuario) redirect("/login");

  const esFuncionario = ROLES_FUNCIONARIOS.includes(rol);
  const completo = identidadCompleta(usuario);

  return (
    <DashboardShell rol={rol} titulo="Mi perfil">
      <div className="mx-auto max-w-lg grid gap-6">
        <div className="panel-card p-6">
          <p className="eyebrow flex items-center gap-1.5 mb-1">
            <Fingerprint size={12} /> Identidad en personaje
          </p>
          <h2 className="font-display text-xl text-marino-950 mb-1">Tus datos oficiales</h2>
          <p className="text-sm text-grafito/55 mb-5 leading-relaxed">
            Estos datos —no tu usuario de Discord— son los que aparecerán en certificados,
            expedientes y cualquier documento oficial que generes.
          </p>

          {searchParams?.error === "rut-duplicado" && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200/60 text-red-700 rounded-lg px-3 py-2.5 text-sm mb-4">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              Ese RUT ya está registrado por otro usuario. Revísalo e inténtalo de nuevo.
            </div>
          )}

          <form action={guardarPerfil} className="grid gap-3">
            <div>
              <label className="block text-xs text-grafito/55 mb-1">Nombre completo (personaje)</label>
              <input
                name="nombreIC"
                defaultValue={usuario.nombreIC ?? ""}
                placeholder="Ej: Fernanda Ibáñez Contreras"
                required
                className="w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-grafito/55 mb-1">RUT</label>
                <input
                  name="rut"
                  defaultValue={usuario.rut ?? ""}
                  placeholder="12345678-9"
                  required
                  className="w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-grafito/55 mb-1">Nacionalidad</label>
                <input
                  name="nacionalidad"
                  defaultValue={usuario.nacionalidad ?? ""}
                  placeholder="Chilena"
                  required
                  className="w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            {esFuncionario && (
              <div>
                <label className="block text-xs text-grafito/55 mb-1">
                  Institución {rol === "FUNCIONARIO" && "(Carabineros, PDI, etc.)"}
                </label>
                <input
                  name="institucion"
                  defaultValue={usuario.institucion ?? INSTITUCION_POR_ROL[rol] ?? ""}
                  placeholder={INSTITUCION_POR_ROL[rol] ?? "Nombre de tu institución"}
                  className="w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            )}
            <div>
              <label className="text-xs text-grafito/55 mb-1 flex items-center gap-1.5">
                <Gamepad2 size={12} /> Usuario de Roblox
              </label>
              <input
                name="robloxUsername"
                defaultValue={usuario.robloxUsername ?? ""}
                placeholder="Tu nombre de usuario exacto en Roblox"
                required
                className="w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-[11px] text-grafito/40 mt-1">
                Se usa para tomar tu foto de avatar de Roblox y ponerla en tu identificación oficial.
              </p>
            </div>
            <button className="button-primary justify-self-start mt-1">Guardar datos</button>
          </form>
        </div>

        {esFuncionario && (
          <div className="panel-card p-6">
            <p className="eyebrow mb-1">Credencial oficial</p>
            <h2 className="font-display text-xl text-marino-950 mb-2">Identificación institucional</h2>
            {completo ? (
              <>
                <p className="text-sm text-grafito/55 mb-4 leading-relaxed">
                  Descarga tu identificación en formato de imagen, generada con tus datos actuales.
                </p>
                <a
                  href={`/api/carnet/${usuario.id}`}
                  target="_blank"
                  className="button-primary inline-flex"
                >
                  <Download size={14} /> Descargar identificación (PNG)
                </a>
              </>
            ) : (
              <p className="text-sm text-grafito/50">
                Completa tu nombre y RUT arriba para poder generar tu identificación.
              </p>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
