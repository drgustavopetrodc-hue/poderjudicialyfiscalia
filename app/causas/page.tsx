import { prisma } from "@/lib/prisma";
import Link from "next/link";


export const dynamic = "force-dynamic";
export default async function CausasPage() {
  const causas = await prisma.causa.findMany({
    orderBy: { creadaEn: "desc" },
    include: { fiscal: true, juez: true },
    take: 50,
  });

  return (
    <main className="min-h-screen bg-hueso px-8 py-12 max-w-4xl mx-auto">
      <p className="font-mono text-xs text-grafito/40 uppercase tracking-widest mb-2">
        Registro público
      </p>
      <h1 className="font-display text-3xl mb-8">Causas</h1>

      <div className="grid gap-3">
        {causas.map((c) => (
          <Link
            key={c.id}
            href={`/causas/${c.id}`}
            className="block bg-white border border-grafito/10 rounded-sm p-5 hover:border-dorado-500/40 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-mono text-xs text-grafito/40">RIT {c.rit}</p>
                <h3 className="font-display text-lg">{c.caratulado}</h3>
                <p className="text-sm text-grafito/50">
                  Fiscal: {c.fiscal.name} {c.juez ? `· Juez: ${c.juez.name}` : ""}
                </p>
              </div>
              <span className="text-xs font-mono uppercase bg-marino-950 text-hueso px-2 py-1 rounded-sm shrink-0">
                {c.estado.replace(/_/g, " ")}
              </span>
            </div>
          </Link>
        ))}
        {causas.length === 0 && <p className="text-grafito/50">Aún no hay causas registradas.</p>}
      </div>
    </main>
  );
}
