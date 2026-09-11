import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { esFiscalRegional, esPresidenteCorteSuprema } from "@/lib/identidad";


export const dynamic = "force-dynamic";
const ROLES = ["ADMIN", "JUEZ", "FISCAL", "ABOGADO", "FUNCIONARIO", "CIUDADANO"];

async function cambiarRol(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.rol !== "ADMIN") return;
  const userId = String(formData.get("userId"));
  const rol = String(formData.get("rol"));
  if (!userId || !ROLES.includes(rol)) return;
  await prisma.user.update({ where: { id: userId }, data: { rol: rol as any } });
  await registrarAuditoria({ actorId: (session?.user as any)?.id, accion: "CAMBIAR_ROL", entidad: "User", entidadId: userId, detalle: `Nuevo rol: ${rol}` });
  revalidatePath("/dashboard/admin/usuarios");
}

async function revocarCredencial(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const actorId = (session?.user as any)?.id as string | undefined;
  if ((session?.user as any)?.rol !== "ADMIN" || !actorId) return;
  const userId = String(formData.get("userId") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim() || "Credencial revocada por administración";
  if (!userId) return;
  await prisma.user.update({ where: { id: userId }, data: { credencialRevocadaEn: new Date(), credencialRevocacionMotivo: motivo } });
  await registrarAuditoria({ actorId, accion: "REVOCAR_CREDENCIAL", entidad: "User", entidadId: userId, detalle: motivo });
  revalidatePath("/dashboard/admin/usuarios");
}

async function reemitirCredencial(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const actorId = (session?.user as any)?.id as string | undefined;
  if ((session?.user as any)?.rol !== "ADMIN" || !actorId) return;
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;
  const usuario = await prisma.user.update({ where: { id: userId }, data: { credencialVersion: { increment: 1 }, credencialRevocadaEn: null, credencialRevocacionMotivo: null }, select: { credencialVersion: true } });
  await registrarAuditoria({ actorId, accion: "REEMITIR_CREDENCIAL", entidad: "User", entidadId: userId, detalle: `Nueva versión: ${usuario.credencialVersion}` });
  revalidatePath("/dashboard/admin/usuarios");
}

async function resolverCertificacion(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.rol !== "ADMIN") return;
  const id = String(formData.get("id"));
  const estado = String(formData.get("estado"));
  if (!id || !["APROBADA", "RECHAZADA", "SUSPENDIDA"].includes(estado)) return;
  await prisma.certificacionAbogado.update({
    where: { id },
    data: { estado: estado as any, revisadoEn: new Date(), observaciones: String(formData.get("observaciones") ?? "") || null },
  });
  revalidatePath("/dashboard/admin/usuarios");
  revalidatePath("/dashboard/admin/certificaciones");
}

async function eliminarCertificacion(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.rol !== "ADMIN") return;
  const id = String(formData.get("id"));
  if (!id) return;
  await prisma.certificacionAbogado.delete({ where: { id } });
  revalidatePath("/dashboard/admin/usuarios");
  revalidatePath("/dashboard/admin/certificaciones");
}

async function certificarDirectamente(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.rol !== "ADMIN") return;
  const userId = String(formData.get("userId"));
  const numeroMatricula = String(formData.get("numeroMatricula") ?? "").trim();
  if (!userId || !numeroMatricula) return;

  try {
    await prisma.certificacionAbogado.create({
      data: { userId, numeroMatricula, estado: "APROBADA", revisadoEn: new Date() },
    });
    await prisma.user.update({ where: { id: userId }, data: { rol: "ABOGADO" } });
  } catch (error) {
    // Probablemente el número de matrícula ya está en uso por otro abogado.
    console.warn("No se pudo certificar directamente (¿matrícula duplicada?):", error);
    return;
  }
  revalidatePath("/dashboard/admin/usuarios");
  revalidatePath("/dashboard/admin/certificaciones");
  revalidatePath("/abogados");
}

export default async function UsuariosAdminPage() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; rol?: string; discordId?: string } | undefined;
  const puedeVerDirectorio = sessionUser?.rol === "ADMIN"
    || esPresidenteCorteSuprema(sessionUser?.discordId)
    || (sessionUser?.rol === "FISCAL" && esFiscalRegional(sessionUser?.discordId));
  if (!puedeVerDirectorio) redirect("/dashboard");

  const usuarios = await prisma.user.findMany({ include: { certificacion: true }, orderBy: { creadoEn: "desc" } });

  return (
    <DashboardShell rol={sessionUser?.rol === "ADMIN" ? "ADMIN" : sessionUser?.rol ?? "FISCAL"} titulo="Directorio de identificaciones">
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="stat-card"><p className="eyebrow">Usuarios registrados</p><p className="mt-2 font-display text-3xl text-marino-950">{usuarios.length}</p></div>
        <div className="stat-card"><p className="eyebrow">Solicitudes pendientes</p><p className="mt-2 font-display text-3xl text-dorado-500">{usuarios.filter((u) => u.certificacion?.estado === "PENDIENTE").length}</p></div>
        <div className="stat-card"><p className="eyebrow">Certificados activos</p><p className="mt-2 font-display text-3xl text-emerald-700">{usuarios.filter((u) => u.certificacion?.estado === "APROBADA").length}</p></div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-grafito/10 bg-white shadow-[0_15px_45px_rgba(11,21,38,0.06)]">
        <div className="border-b border-grafito/10 px-5 py-4"><p className="font-display text-xl text-marino-950">Directorio de identificaciones</p><p className="text-sm text-grafito/50">Consulta y descarga las identificaciones de los usuarios registrados.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-sm">
          <thead className="bg-marino-950 text-hueso text-left">
            <tr>
              <th className="px-4 py-3 font-mono text-xs uppercase">Usuario</th>
              <th className="px-4 py-3 font-mono text-xs uppercase">Rol actual</th>
              <th className="px-4 py-3 font-mono text-xs uppercase">Cambiar rol</th>
              <th className="px-4 py-3 font-mono text-xs uppercase">Certificación</th>
              <th className="px-4 py-3 font-mono text-xs uppercase">Credencial</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t border-grafito/10">
                <td className="px-4 py-3">
                  <p>{u.name ?? u.email ?? u.id}</p>
                  <p className="text-xs text-grafito/45">{u.nombreIC ?? "Sin nombre institucional"}</p>
                  {u.nombreIC && u.rut && !u.credencialRevocadaEn && (
                    <a href={`/api/carnet/${u.id}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-xs font-semibold text-blue-700 underline">
                      Descargar identificación
                    </a>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="badge bg-hueso border border-grafito/10 text-grafito/70">
                    {u.rol}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="min-w-[190px] space-y-2">
                    <span className={`text-xs ${u.credencialRevocadaEn ? "text-red-700" : "text-emerald-700"}`}>{u.credencialRevocadaEn ? "Revocada" : `Vigente · v${u.credencialVersion}`}</span>
                    {u.credencialRevocadaEn ? <form action={reemitirCredencial}><input type="hidden" name="userId" value={u.id} /><button className="rounded-lg bg-emerald-700 px-2 py-1 text-xs text-white">Reemitir</button></form> : <form action={revocarCredencial} className="flex gap-1"><input type="hidden" name="userId" value={u.id} /><input name="motivo" placeholder="Motivo" className="w-24 rounded border px-1 text-xs" /><button className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700">Revocar</button></form>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <form action={cambiarRol} className="flex gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <select name="rol" defaultValue={u.rol} className="border border-grafito/15 rounded-lg px-2 py-1">
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <button className="button-primary">
                      Guardar
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  {u.certificacion ? <div className="min-w-[300px]">
                  <form action={resolverCertificacion} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={u.certificacion.id} />
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${u.certificacion.estado === "APROBADA" ? "bg-emerald-100 text-emerald-800" : u.certificacion.estado === "PENDIENTE" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>{u.certificacion.estado}</span>
                    {u.certificacion.estado === "PENDIENTE" && <><input name="observaciones" placeholder="Observación opcional" className="w-36 rounded-lg border border-grafito/15 px-2 py-1.5 text-xs" /><button name="estado" value="APROBADA" className="rounded-lg bg-emerald-700 px-2.5 py-1.5 text-xs font-semibold text-white">Aprobar</button><button name="estado" value="RECHAZADA" className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-700">Rechazar</button></>}
                  </form>
                  <form action={eliminarCertificacion} className="mt-1"><input type="hidden" name="id" value={u.certificacion.id} /><button className="text-[10px] text-red-700 hover:underline">Eliminar certificación</button></form>
                  </div> : (
                    <form action={certificarDirectamente} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <input
                        name="numeroMatricula"
                        required
                        placeholder="N° matrícula"
                        className="w-28 rounded-lg border border-grafito/15 px-2 py-1.5 text-xs"
                      />
                      <button className="rounded-lg bg-dorado-500 px-2.5 py-1.5 text-xs font-semibold text-marino-950 hover:bg-dorado-400">
                        Certificar directamente
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </DashboardShell>
  );
}
