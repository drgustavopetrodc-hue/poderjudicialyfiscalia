import { prisma } from "@/lib/prisma";
import { esFiscalRegional, esPresidenteCorteSuprema, formatearRut, ROLES_FUNCIONARIOS } from "@/lib/identidad";
import { notFound } from "next/navigation";
import { credencialValida } from "@/lib/credencial";

export const dynamic = "force-dynamic";

const NOMBRE_ROL: Record<string, string> = {
  ADMIN: "Ministro de Corte Suprema",
  JUEZ: "Juez de la República",
  FISCAL: "Fiscal Adjunto",
  FUNCIONARIO: "Policía Judicial",
};

export default async function VerificarCredencialPage({ params, searchParams }: { params: { userId: string }; searchParams?: { firma?: string } }) {
  const firmaValida = Boolean(searchParams?.firma && credencialValida(params.userId, searchParams.firma));
  if (!firmaValida) {
    return (
      <main className="min-h-screen bg-hueso px-5 py-10 text-grafito">
        <section className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-xl">
          <p className="font-mono text-sm font-bold uppercase tracking-widest text-red-700">Credencial no válida</p>
          <h1 className="mt-3 font-display text-3xl">No se pudo autenticar</h1>
          <p className="mt-3 text-sm text-grafito/60">El código no contiene una firma institucional válida. Solicita una credencial emitida nuevamente por el sistema oficial.</p>
        </section>
      </main>
    );
  }

  const usuario = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      nombreIC: true,
      name: true,
      rut: true,
      nif: true,
      rol: true,
      activo: true,
      institucion: true,
      creadoEn: true,
      discordId: true,
    },
  });

  if (!usuario || !ROLES_FUNCIONARIOS.includes(usuario.rol)) notFound();

  const esPresidente = esPresidenteCorteSuprema(usuario.discordId);
  const cargo = esPresidente
    ? "Presidente de la Corte Suprema"
    : esFiscalRegional(usuario.discordId) && usuario.rol === "FISCAL"
      ? "Fiscal Regional"
      : NOMBRE_ROL[usuario.rol] ?? usuario.rol;
  const vigente = usuario.activo;
  const institucion = usuario.rol === "FISCAL" ? "Ministerio Público de Chile" : "Poder Judicial de Chile";

  return (
    <main className="min-h-screen bg-hueso px-5 py-10 text-grafito">
      <section className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-grafito/10 bg-white shadow-xl">
        <header className="bg-marino-950 px-6 py-8 text-center text-white">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-dorado-300">Verificación institucional</p>
          <h1 className="mt-3 font-display text-3xl">Credencial oficial</h1>
          <p className="mt-2 text-sm text-hueso/65">Registro público de autenticidad</p>
        </header>

        <div className="p-6">
          <div className={`mb-6 rounded-xl border p-4 ${vigente ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
            <p className={`font-mono text-sm font-bold uppercase tracking-widest ${vigente ? "text-green-700" : "text-red-700"}`}>
              {vigente ? "Credencial vigente" : "Credencial no vigente"}
            </p>
            <p className="mt-1 text-sm text-grafito/65">
              {vigente ? "La identidad consultada se encuentra activa en el registro institucional." : "La identidad consultada está desactivada y esta credencial no debe considerarse válida."}
            </p>
          </div>

          <dl className="divide-y divide-grafito/10">
            <div className="grid gap-1 py-3 sm:grid-cols-[170px_1fr]"><dt className="text-sm text-grafito/50">Nombre</dt><dd className="font-semibold">{usuario.nombreIC || usuario.name || "Sin nombre registrado"}</dd></div>
            <div className="grid gap-1 py-3 sm:grid-cols-[170px_1fr]"><dt className="text-sm text-grafito/50">Cargo</dt><dd>{cargo}</dd></div>
            <div className="grid gap-1 py-3 sm:grid-cols-[170px_1fr]"><dt className="text-sm text-grafito/50">Institución</dt><dd>{institucion}</dd></div>
            <div className="grid gap-1 py-3 sm:grid-cols-[170px_1fr]"><dt className="text-sm text-grafito/50">RUT</dt><dd>{usuario.rut ? formatearRut(usuario.rut) : "No registrado"}</dd></div>
            {usuario.rol === "FISCAL" && <div className="grid gap-1 py-3 sm:grid-cols-[170px_1fr]"><dt className="text-sm text-grafito/50">NIF fiscal</dt><dd>{usuario.nif || "No asignado"}</dd></div>}
            <div className="grid gap-1 py-3 sm:grid-cols-[170px_1fr]"><dt className="text-sm text-grafito/50">Registro desde</dt><dd>{usuario.creadoEn.toLocaleDateString("es-CL")}</dd></div>
          </dl>

          <p className="mt-6 text-center text-xs leading-5 text-grafito/45">
            Esta página fue abierta mediante el código QR de la credencial. La vigencia depende del estado actual del registro institucional.
          </p>
        </div>
      </section>
    </main>
  );
}
