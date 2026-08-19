import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AbogadosPage() {
  const certificados = await prisma.certificacionAbogado.findMany({
    where: { estado: "APROBADA" },
    include: { user: true },
    orderBy: { revisadoEn: "desc" },
  });

  return (
    <main className="min-h-screen bg-hueso px-8 py-12 max-w-4xl mx-auto">
      <p className="font-mono text-xs text-grafito/40 uppercase tracking-widest mb-2">
        Registro público
      </p>
      <h1 className="font-display text-3xl mb-2">Abogados certificados</h1>
      <p className="text-grafito/50 mb-8">
        Nómina de abogados habilitados para ejercer la defensa técnica, certificados por la Corte Suprema.
      </p>

      <div className="grid gap-3">
        {certificados.map((c) => (
          <div
            key={c.id}
            className="bg-white border border-grafito/10 rounded-sm p-5 flex justify-between items-center"
          >
            <div>
              <h3 className="font-display text-lg">{c.user.name}</h3>
              <p className="text-sm text-grafito/50">
                Matrícula <span className="font-mono">{c.numeroMatricula}</span>
                {c.revisadoEn && ` · Certificado el ${format(c.revisadoEn, "dd/MM/yyyy")}`}
              </p>
            </div>
            <a
              href={`/api/certificados/${c.user.id}`}
              className="text-sm bg-marino-950 text-hueso px-4 py-2 rounded-sm hover:bg-marino-900 shrink-0"
              target="_blank"
            >
              Descargar certificado
            </a>
          </div>
        ))}
        {certificados.length === 0 && (
          <p className="text-grafito/50">Aún no hay abogados certificados.</p>
        )}
      </div>
    </main>
  );
}
