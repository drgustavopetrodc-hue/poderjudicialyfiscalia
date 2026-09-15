import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatearRut, nombreLegal } from "@/lib/identidad";

export const dynamic = "force-dynamic";

export default async function VerificarCertificadoPage({ params }: { params: { userId: string } }) {
  const certificacion = await prisma.certificacionAbogado.findUnique({
    where: { userId: params.userId },
    include: { user: true },
  });

  if (!certificacion || !certificacion.user.rut || !certificacion.user.nombreIC) notFound();

  const valida = certificacion.estado === "APROBADA";
  const fechaExpedicion = certificacion.revisadoEn ?? certificacion.solicitadoEn;

  return (
    <main className="min-h-screen bg-hueso px-5 py-10 text-grafito">
      <section className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-grafito/10 bg-white shadow-xl">
        <header className="bg-marino-950 px-6 py-8 text-center text-white">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-dorado-300">Verificación institucional</p>
          <h1 className="mt-3 font-display text-3xl">Certificación de abogado</h1>
          <p className="mt-2 text-sm text-hueso/65">Registro público de autenticidad</p>
        </header>

        <div className="p-6">
          <div className={`mb-6 rounded-xl border p-4 ${valida ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
            <p className={`font-mono text-sm font-bold uppercase tracking-widest ${valida ? "text-green-700" : "text-red-700"}`}>
              {valida ? "Certificación válida" : "Certificación no válida"}
            </p>
            <p className="mt-1 text-sm text-grafito/65">
              {valida ? "La persona identificada se encuentra certificada por la Corte Suprema." : "Esta certificación no se encuentra aprobada y no debe considerarse válida."}
            </p>
          </div>

          <dl className="divide-y divide-grafito/10">
            <div className="grid gap-1 py-3 sm:grid-cols-[170px_1fr]"><dt className="text-sm text-grafito/50">Nombre</dt><dd className="font-semibold">{nombreLegal(certificacion.user)}</dd></div>
            <div className="grid gap-1 py-3 sm:grid-cols-[170px_1fr]"><dt className="text-sm text-grafito/50">RUT</dt><dd>{formatearRut(certificacion.user.rut)}</dd></div>
            <div className="grid gap-1 py-3 sm:grid-cols-[170px_1fr]"><dt className="text-sm text-grafito/50">Número de certificación</dt><dd>{certificacion.numeroMatricula}</dd></div>
            <div className="grid gap-1 py-3 sm:grid-cols-[170px_1fr]"><dt className="text-sm text-grafito/50">Fecha de audiencia</dt><dd>{fechaExpedicion.toLocaleDateString("es-CL")}</dd></div>
            <div className="grid gap-1 py-3 sm:grid-cols-[170px_1fr]"><dt className="text-sm text-grafito/50">Institución</dt><dd>Corte Suprema de Chile</dd></div>
          </dl>

          <Link href={`/api/certificados/${certificacion.userId}`} className="button-primary mt-6 inline-flex w-full justify-center">
            Descargar certificado PDF
          </Link>
          <p className="mt-6 text-center text-xs leading-5 text-grafito/45">
            Esta página fue abierta mediante el código QR del certificado. La validez se consulta contra el registro actual.
          </p>
        </div>
      </section>
    </main>
  );
}
