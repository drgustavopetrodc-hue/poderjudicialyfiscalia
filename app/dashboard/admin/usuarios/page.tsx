import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import { revalidatePath } from "next/cache";


export const dynamic = "force-dynamic";
const ROLES = ["ADMIN", "JUEZ", "FISCAL", "ABOGADO", "FUNCIONARIO", "CIUDADANO"];

async function cambiarRol(formData: FormData) {
  "use server";
  const userId = String(formData.get("userId"));
  const rol = String(formData.get("rol"));
  if (!userId || !ROLES.includes(rol)) return;
  await prisma.user.update({ where: { id: userId }, data: { rol: rol as any } });
  revalidatePath("/dashboard/admin/usuarios");
}

export default async function UsuariosAdminPage() {
  const usuarios = await prisma.user.findMany({ orderBy: { creadoEn: "desc" } });

  return (
    <DashboardShell rol="ADMIN" titulo="Usuarios y roles">
      <div className="bg-white border border-grafito/10 rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-marino-950 text-hueso text-left">
            <tr>
              <th className="px-4 py-3 font-mono text-xs uppercase">Usuario</th>
              <th className="px-4 py-3 font-mono text-xs uppercase">Rol actual</th>
              <th className="px-4 py-3 font-mono text-xs uppercase">Cambiar rol</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
