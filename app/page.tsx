import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-marino-950 text-hueso relative overflow-hidden">
      {/* Sello ornamental de fondo */}
      <div className="sello absolute inset-0 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6 py-24">
        <p className="font-mono text-dorado-400 text-sm tracking-[0.3em] uppercase mb-6">
          República · Sistema Judicial
        </p>
        <h1 className="font-display text-5xl md:text-7xl leading-[1.05] mb-8 max-w-3xl">
          La justicia, <span className="text-dorado-400">administrada con orden.</span>
        </h1>
        <p className="text-hueso/70 text-lg max-w-xl mb-12 leading-relaxed">
          Registro de causas, certificación de abogados, presentación de escritos,
          defensa técnica y audiencias — todo en un mismo expediente digital para
          el servidor.
        </p>

        <div className="flex gap-4">
          <Link
            href="/login"
            className="bg-dorado-400 text-marino-950 font-semibold px-7 py-3 rounded-sm hover:bg-dorado-300 transition-colors"
          >
            Ingresar con Discord
          </Link>
          <Link
            href="/causas"
            className="border border-hueso/25 px-7 py-3 rounded-sm hover:border-hueso/50 transition-colors"
          >
            Ver causas públicas
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-hueso/10 mt-24 border border-hueso/10">
          {[
            ["01", "Causas", "Registro y seguimiento de expedientes"],
            ["02", "Abogados", "Certificación y matrícula habilitante"],
            ["03", "Audiencias", "Agenda de formalización y juicio oral"],
            ["04", "Sentencias", "Resoluciones dictadas por el tribunal"],
          ].map(([num, title, desc]) => (
            <div key={num} className="bg-marino-950 p-6">
              <span className="font-mono text-dorado-400/70 text-xs">{num}</span>
              <h3 className="font-display text-xl mt-2 mb-1">{title}</h3>
              <p className="text-hueso/50 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
