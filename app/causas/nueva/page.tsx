import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import { redirect } from "next/navigation";

const ROLES_CON_ACCESO = ["FISCAL", "ADMIN"];

async function crearCausa(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const fiscalId = (session?.user as any)?.id as string;
  const rol = (session?.user as any)?.rol;
  if (!fiscalId || !ROLES_CON_ACCESO.includes(rol)) return;

  const rit = String(formData.get("rit"));
  const caratulado = String(formData.get("caratulado"));
  const delito = String(formData.get("delito"));
  const descripcion = String(formData.get("descripcion"));

  const causa = await prisma.causa.create({
    data: { rit, caratulado, delito, descripcion, fiscalId },
  });

  redirect(`/causas/${causa.id}`);
}

export default async function NuevaCausaPage() {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol as string | undefined;

  if (!rol || !ROLES_CON_ACCESO.includes(rol)) {
    redirect("/dashboard?error=sin-permiso");
  }

  return (
    <DashboardShell rol={rol} titulo="Registrar nueva causa">
      <form action={crearCausa} className="max-w-lg bg-white border border-grafito/10 rounded-sm p-6 grid gap-4">
        {rol === "ADMIN" && (
          <p className="text-xs text-dorado-500 bg-dorado-400/10 border border-dorado-500/30 rounded-sm px-3 py-2">
            Estás registrando esta causa como Corte Suprema, actuando en calidad de fiscal para fines de prueba.
          </p>
        )}
        <div>
          <label className="block text-sm text-grafito/60 mb-1">RIT (rol interno del tribunal)</label>
          <input name="rit" required placeholder="001-2026" className="w-full border border-grafito/20 rounded-sm px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-grafito/60 mb-1">Caratulado</label>
          <input name="caratulado" required placeholder="Fisco vs. Juan Pérez" className="w-full border border-grafito/20 rounded-sm px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-grafito/60 mb-1">Delito imputado</label>
          <input name="delito" required placeholder="Robo con violencia" className="w-full border border-grafito/20 rounded-sm px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-grafito/60 mb-1">Descripción de los hechos</label>
          <textarea name="descripcion" required rows={5} className="w-full border border-grafito/20 rounded-sm px-3 py-2" />
        </div>
        <button className="bg-marino-950 text-hueso px-5 py-2.5 rounded-sm text-sm hover:bg-marino-900 justify-self-start">
          Registrar causa
        </button>
      </form>
    </DashboardShell>
  );
}
