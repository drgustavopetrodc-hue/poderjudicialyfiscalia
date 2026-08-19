import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


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

export default async function UsuariosAdminPage() {
  const usuarios = await prisma.user.findMany({ include: { certificacion: true }, orderBy: { creadoEn: "desc" } });

  return (
    <DashboardShell rol="ADMIN" titulo="Usuarios y roles">
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="stat-card"><p className="eyebrow">Usuarios registrados</p><p className="mt-2 font-display text-3xl text-marino-950">{usuarios.length}</p></div>
        <div className="stat-card"><p className="eyebrow">Solicitudes pendientes</p><p className="mt-2 font-display text-3xl text-dorado-500">{usuarios.filter((u) => u.certificacion?.estado === "PENDIENTE").length}</p></div>
        <div className="stat-card"><p className="eyebrow">Certificados activos</p><p className="mt-2 font-display text-3xl text-emerald-700">{usuarios.filter((u) => u.certificacion?.estado === "APROBADA").length}</p></div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-grafito/10 bg-white shadow-[0_15px_45px_rgba(11,21,38,0.06)]">
        <div className="border-b border-grafito/10 px-5 py-4"><p className="font-display text-xl text-marino-950">Directorio y certificaciones</p><p className="text-sm text-grafito/50">Administra roles y habilita abogados desde una sola vista.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-sm">
          <thead className="bg-marino-950 text-hueso text-left">
            <tr>
              <th className="px-4 py-3 font-mono text-xs uppercase">Usuario</th>
              <th className="px-4 py-3 font-mono text-xs uppercase">Rol actual</th>
              <th className="px-4 py-3 font-mono text-xs uppercase">Cambiar rol</th>
              <th className="px-4 py-3 font-mono text-xs uppercase">Certificación</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t border-grafito/10">
                <td className="px-4 py-3">{u.name ?? u.email ?? u.id}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs uppercase bg-hueso px-2 py-1 rounded-sm border border-grafito/10">
                    {u.rol}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <form action={cambiarRol} className="flex gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <select name="rol" defaultValue={u.rol} className="border border-grafito/20 rounded-sm px-2 py-1">
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <button className="bg-marino-950 text-hueso px-3 py-1 rounded-sm hover:bg-marino-900">
                      Guardar
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  {u.certificacion ? <form action={resolverCertificacion} className="flex min-w-[300px] items-center gap-2">
                    <input type="hidden" name="id" value={u.certificacion.id} />
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${u.certificacion.estado === "APROBADA" ? "bg-emerald-100 text-emerald-800" : u.certificacion.estado === "PENDIENTE" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>{u.certificacion.estado}</span>
                    {u.certificacion.estado === "PENDIENTE" && <><input name="observaciones" placeholder="Observación opcional" className="w-36 rounded-lg border border-grafito/15 px-2 py-1.5 text-xs" /><button name="estado" value="APROBADA" className="rounded-lg bg-emerald-700 px-2.5 py-1.5 text-xs font-semibold text-white">Aprobar</button><button name="estado" value="RECHAZADA" className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-700">Rechazar</button></>}
                  </form> : <span className="text-xs text-grafito/35">No solicitada</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </DashboardShell>
  );
}
