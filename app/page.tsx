import Link from "next/link";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#edf1f4] px-5 py-12 text-slate-800">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#0c5b86]">Poder Judicial</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#0b2437] md:text-5xl">
            Selección de portal
          </h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/ovj"
            className="group rounded-2xl border border-[#0a4d73] bg-[#0b2437] p-8 text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="mb-4 inline-flex rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#dfe85d]">
              OVJ
            </div>
            <h2 className="text-2xl font-bold">Oficina Judicial Virtual</h2>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Portal institucional actual con consulta, causas, denuncias, órdenes y funciones judiciales y administrativas.
            </p>
            <div className="mt-6 inline-flex items-center font-semibold text-[#dfe85d]">
              Entrar al portal OVJ →
            </div>
          </Link>

          <Link
            href="/mi-fiscalia"
            className="group rounded-2xl border border-[#0c5b86] bg-white p-8 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="mb-4 inline-flex rounded-full border border-[#0c5b86]/20 bg-[#eaf6ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#0c5b86]">
              Mi Fiscalía
            </div>
            <h2 className="text-2xl font-bold text-[#0b2437]">en línea</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Nueva experiencia para fiscales, funcionarios y usuarios del sistema de atención y gestión de la Fiscalía.
            </p>
            <div className="mt-6 inline-flex items-center font-semibold text-[#0c5b86]">
              Entrar a Mi Fiscalía en Línea →
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
