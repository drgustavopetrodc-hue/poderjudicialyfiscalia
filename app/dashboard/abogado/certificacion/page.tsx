import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import { revalidatePath } from "next/cache";

async function solicitarCertificacion(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string;
  const numeroMatricula = String(formData.get("numeroMatricula") ?? "").trim();
  if (!userId || !numeroMatricula) return;

  await prisma.certificacionAbogado.upsert({
    where: { userId },
    create: { userId, numeroMatricula },
    update: { numeroMatricula, estado: "PENDIENTE" },
  });
  revalidatePath("/dashboard/abogado/certificacion");
}

export default async function CertificacionPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string;
  const certificacion = await prisma.certificacionAbogado.findUnique({ where: { userId } });

  return (
    <DashboardShell rol="ABOGADO" titulo="Certificación de abogado">
      {certificacion ? (
        <div className="bg-white border border-grafito/10 rounded-sm p-6 max-w-md">
          <p className="text-sm text-grafito/50 mb-1">Número de matrícula</p>
          <p className="font-mono text-lg mb-4">{certificacion.numeroMatricula}</p>
          <p className="text-sm text-grafito/50 mb-1">Estado</p>
          <span className="inline-block font-mono text-xs uppercase bg-marino-950 text-hueso px-2 py-1 rounded-sm">
            {certificacion.estado}
          </span>
          {certificacion.observaciones && (
            <p className="text-sm text-grafito/60 mt-4 italic">
              "{certificacion.observaciones}"
            </p>
          )}
        </div>
      ) : (
        <form action={solicitarCertificacion} className="max-w-md bg-white border border-grafito/10 rounded-sm p-6">
          <label className="block text-sm text-grafito/60 mb-2">
            Número de matrícula (elige el que use tu personaje de rol)
          </label>
          <input
            name="numeroMatricula"
            required
            className="w-full border border-grafito/20 rounded-sm px-3 py-2 mb-4"
            placeholder="ej. AB-2026-014"
          />
          <button className="bg-marino-950 text-hueso px-5 py-2.5 rounded-sm text-sm hover:bg-marino-900">
            Solicitar certificación
          </button>
        </form>
      )}
    </DashboardShell>
  );
}
