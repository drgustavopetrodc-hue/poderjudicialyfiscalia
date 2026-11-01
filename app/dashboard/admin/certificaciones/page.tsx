import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export const dynamic = "force-dynamic";
async function resolverCertificacion(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.rol !== "ADMIN") return;
  const id = String(formData.get("id"));
  const estado = String(formData.get("estado"));
  const observaciones = String(formData.get("observaciones") ?? "");
  if (!id || !["APROBADA", "RECHAZADA"].includes(estado)) return;

  await prisma.certificacionAbogado.update({
    where: { id },
    data: { estado: estado as any, observaciones, revisadoEn: new Date() },
  });

  
  if (estado === "APROBADA") {
    const cert = await prisma.certificacionAbogado.findUnique({ where: { id } });
    if (cert) await prisma.user.update({ where: { id: cert.userId }, data: { rol: "ABOGADO" } });
  }

  revalidatePath("/dashboard/admin/certificaciones");
}

async function eliminarCertificacion(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.rol !== "ADMIN") return;
  const id = String(formData.get("id"));
  if (!id) return;
  await prisma.certificacionAbogado.delete({ where: { id } });
  revalidatePath("/dashboard/admin/certificaciones");
}

export default async function CertificacionesAdminPage() {
  const certificaciones = await prisma.certificacionAbogado.findMany({
    where: { estado: "PENDIENTE" },
    include: { user: true },
    orderBy: { solicitadoEn: "asc" },
  });

  return (
    <DashboardShell rol="ADMIN" titulo="Certificaciones pendientes">
      {certificaciones.length === 0 ? (
        <p className="text-grafito/50">No hay solicitudes pendientes.</p>
      ) : (
        <div className="grid gap-4">
          {certificaciones.map((c) => (
            <div key={c.id} className="panel-card p-5">
            <form action={resolverCertificacion}>
              <input type="hidden" name="id" value={c.id} />
              <p className="font-display text-lg">{c.user.name}</p>
              <p className="text-sm text-grafito/50 mb-3">
                Matrícula solicitada: <span className="font-mono">{c.numeroMatricula}</span>
              </p>
              <input
                name="observaciones"
                placeholder="Observaciones (opcional)"
                className="w-full border border-grafito/15 rounded-lg px-3 py-2 mb-3 text-sm"
              />
              <div className="flex gap-2">
                <button
                  name="estado"
                  value="APROBADA"
                  className="button-primary"
                >
                  Aprobar
                </button>
                <button
                  name="estado"
                  value="RECHAZADA"
                  className="button-outline"
                >
                  Rechazar
                </button>
              </div>
            </form>
            <form action={eliminarCertificacion} className="mt-2"><input type="hidden" name="id" value={c.id} /><button className="text-xs text-red-700 hover:underline">Eliminar solicitud</button></form>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
