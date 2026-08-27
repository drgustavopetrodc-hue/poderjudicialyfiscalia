import Link from "next/link";
import { Scale, ShieldCheck, CalendarClock, Gavel, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-marino-950 text-hueso relative overflow-hidden">
      <div className="sello absolute inset-0 pointer-events-none" />
      <div className="grid-ornamento absolute inset-0 pointer-events-none opacity-30" />
      <div
        className="absolute -top-40 -right-40 w-[560px] h-[560px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,.16), transparent 70%)" }}
      />

      <div className="relative max-w-5xl mx-auto px-6 py-24">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-full border border-dorado-400/40 flex items-center justify-center bg-hueso/[0.04]">
            <Scale size={16} className="text-dorado-400" strokeWidth={1.75} />
          </div>
          <p className="font-mono text-dorado-400 text-xs tracking-[0.3em] uppercase">
            República · Sistema Judicial
          </p>
        </div>

        <h1 className="font-display text-5xl md:text-7xl leading-[1.05] mb-8 max-w-3xl">
          La justicia, <span className="text-dorado-400">administrada con orden.</span>
        </h1>
        <p className="text-hueso/65 text-lg max-w-xl mb-12 leading-relaxed">
          Registro de causas, certificación de abogados, presentación de escritos,
          defensa técnica y audiencias — todo en un mismo expediente digital para
          el servidor.
        </p>

        <div className="flex flex-wrap gap-4 mb-24">
          <Link
            href="/login"
            className="group flex items-center gap-2 bg-dorado-400 text-marino-950 font-semibold px-7 py-3.5 rounded-lg hover:bg-dorado-300 transition-all hover:-translate-y-0.5 shadow-[0_8px_24px_-8px_rgba(37,99,235,.6)]"
          >
            Ingresar con Discord
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/abogados"
            className="border border-hueso/20 px-7 py-3.5 rounded-lg hover:border-hueso/40 hover:bg-hueso/[0.03] transition-colors"
          >
            Ver abogados certificados
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Scale, title: "Causas", desc: "Registro y seguimiento de expedientes judiciales" },
            { icon: ShieldCheck, title: "Abogados", desc: "Certificación y matrícula habilitante" },
            { icon: CalendarClock, title: "Audiencias", desc: "Agenda de formalización y juicio oral" },
            { icon: Gavel, title: "Sentencias", desc: "Resoluciones dictadas por el tribunal" },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="border border-hueso/10 rounded-xl p-6 bg-hueso/[0.02] hover:bg-hueso/[0.04] hover:border-dorado-400/25 transition-colors"
            >
              <Icon size={20} className="text-dorado-400 mb-4" strokeWidth={1.5} />
              <h3 className="font-display text-xl mb-1.5">{title}</h3>
              <p className="text-hueso/45 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
