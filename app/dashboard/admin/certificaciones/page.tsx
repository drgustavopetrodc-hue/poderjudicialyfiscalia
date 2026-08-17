import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import { revalidatePath } from "next/cache";


export const dynamic = "force-dynamic";
async function resolverCertificacion(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const estado = String(formData.get("estado"));
  const observaciones = String(formData.get("observaciones") ?? "");
  if (!id || !["APROBADA", "RECHAZADA"].includes(estado)) return;

  await prisma.certificacionAbogado.update({
    where: { id },
    data: { estado: estado as any, observaciones, revisadoEn: new Date() },
  });

  // Si se aprueba, el usuario pasa a tener rol ABOGADO automáticamente
  if (estado === "APROBADA") {
    const cert = await prisma.certificacionAbogado.findUnique({ where: { id } });
    if (cert) await prisma.user.update({ where: { id: cert.userId }, data: { rol: "ABOGADO" } });
  }

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
            <form
              key={c.id}
              action={resolverCertificacion}
              className="bg-white border border-grafito/10 rounded-sm p-5"
            >
              <input type="hidden" name="id" value={c.id} />
              <p className="font-display text-lg">{c.user.name}</p>
              <p className="text-sm text-grafito/50 mb-3">
                Matrícula solicitada: <span className="font-mono">{c.numeroMatricula}</span>
              </p>
              <input
                name="observaciones"
                placeholder="Observaciones (opcional)"
                className="w-full border border-grafito/20 rounded-sm px-3 py-2 mb-3 text-sm"
              />
              <div className="flex gap-2">
                <button
                  name="estado"
                  value="APROBADA"
                  className="bg-marino-950 text-hueso px-4 py-2 rounded-sm text-sm hover:bg-marino-900"
                >
                  Aprobar
                </button>
                <button
                  name="estado"
                  value="RECHAZADA"
                  className="border border-grafito/20 px-4 py-2 rounded-sm text-sm hover:border-grafito/40"
                >
                  Rechazar
                </button>
              </div>
            </form>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
