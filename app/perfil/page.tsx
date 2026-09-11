import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import DashboardShell from "@/components/DashboardShell";
import { ROLES_FUNCIONARIOS, INSTITUCION_POR_ROL, identidadCompleta, generarNifFiscal, normalizarRut } from "@/lib/identidad";
import { Fingerprint, Download, AlertCircle, Gamepad2 } from "lucide-react";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

async function guardarPerfil(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string;
  if (!userId) return;

  const nombreIC = String(formData.get("nombreIC") ?? "").trim();
  const rutIngresado = String(formData.get("rut") ?? "").trim();
  const rut = rutIngresado ? normalizarRut(rutIngresado) : "";
  const nacionalidad = String(formData.get("nacionalidad") ?? "").trim();
  const institucion = String(formData.get("institucion") ?? "").trim();
  const robloxUsername = String(formData.get("robloxUsername") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirmacion = String(formData.get("passwordConfirmacion") ?? "");
  const rol = (session?.user as any)?.rol as string | undefined;
  const usuarioActual = await prisma.user.findUnique({ where: { id: userId } });
  if (!usuarioActual) return;
  if (!usuarioActual.passwordHash && password.length < 8) redirect("/perfil?error=password-corta");
  if (password && password !== passwordConfirmacion) redirect("/perfil?error=password-diferente");
  const passwordHash = password ? await bcrypt.hash(password, 12) : usuarioActual.passwordHash;
  const nif = rol === "FISCAL" ? (usuarioActual?.nif || generarNifFiscal(userId)) : usuarioActual?.nif || null;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        nombreIC: nombreIC || null,
        rut: rut || null,
        nif: nif || null,
        nacionalidad: nacionalidad || null,
        institucion: institucion || null,
        robloxUsername: robloxUsername || null,
        passwordHash,
      },
    });
  } catch (error) {
    // Lo más probable: el RUT ya está registrado por otro usuario (es único).
    console.warn("No se pudo guardar el perfil (¿RUT duplicado?):", error);
    redirect("/perfil?error=rut-duplicado");
  }

  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  redirect("/perfil?guardado=1");
}

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: { error?: string; setup?: string; guardado?: string };
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

          {searchParams?.setup === "1" && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-3 text-sm text-blue-800">
              Completa tu perfil para activar tu cuenta institucional. El RUT se utilizará en tus documentos oficiales; la autenticación y la seguridad de acceso se gestionan mediante Discord.
            </div>
          )}

          {searchParams?.error === "rut-duplicado" && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200/60 text-red-700 rounded-lg px-3 py-2.5 text-sm mb-4">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              Ese RUT ya está registrado por otro usuario. Revísalo e inténtalo de nuevo.
            </div>
          )}
          {searchParams?.error === "password-corta" && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">La contraseña debe tener al menos 8 caracteres.</p>}
          {searchParams?.error === "password-diferente" && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Las contraseñas no coinciden.</p>}
          {searchParams?.guardado === "1" && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">Perfil y contraseña guardados correctamente. Ya puedes ingresar con tu RUT y contraseña.</p>}

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
            <div className="grid gap-3 rounded-lg border border-blue-100 bg-blue-50/40 p-3">
              <p className="text-xs text-blue-800">{usuario.passwordHash ? "Puedes cambiar tu contraseña local." : "Crea una contraseña para poder ingresar también con RUT."}</p>
              <input name="password" type="password" minLength={8} required={!usuario.passwordHash} placeholder="Contraseña (mínimo 8 caracteres)" className="w-full rounded-lg border border-grafito/15 px-3 py-2 text-sm" />
              <input name="passwordConfirmacion" type="password" minLength={8} required={!usuario.passwordHash} placeholder="Repite la contraseña" className="w-full rounded-lg border border-grafito/15 px-3 py-2 text-sm" />
            </div>
            {rol === "FISCAL" && (
              <div>
                <label className="block text-xs text-grafito/55 mb-1">NIF</label>
                <input
                  value={usuario.nif ?? generarNifFiscal(usuario.id)}
                  readOnly
                  className="w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm bg-hueso/40 text-grafito/75"
                />
                <p className="text-[11px] text-grafito/40 mt-1">Se genera automáticamente al crear el perfil de un fiscal.</p>
              </div>
            )}
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

        {(["ADMIN", "JUEZ", "FISCAL"].includes(rol)) && (
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
