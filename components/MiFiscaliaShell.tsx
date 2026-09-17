import Link from "next/link";
import { ReactNode } from "react";
import { Scale, ShieldAlert, FileText, ArrowLeft } from "lucide-react";

export default function MiFiscaliaShell({
  title,
  children,
  rol,
}: {
  title: string;
  children: ReactNode;
  rol?: string;
}) {
  const items = [
    { href: "/mi-fiscalia/denuncias?tab=presentar", label: "Gestionar Causas" },
  ];

  return (
    <div className="min-h-screen bg-[#f4f8fb] text-[#16324a]">
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-[#d7e8f4] bg-[#0F69B4] text-white shadow-xl">
        <div className="flex items-center gap-3 border-b border-white/20 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-white text-[#0F69B4]">
            <Scale size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white">Mi Fiscalía</p>
            <p className="text-sm font-semibold">en línea</p>
          </div>
        </div>

        <nav className="space-y-2 p-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-sm bg-white/10 px-3 py-3 text-sm font-medium text-white/90 transition hover:bg-[#EB3C46]"
            >
              <FileText size={16} className="text-white" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/20 p-4 text-xs text-white/70">
          <div className="mb-2 flex items-center gap-2 rounded-sm bg-white/10 px-2 py-2">
            <ShieldAlert size={14} className="text-white" />
            {rol ? rol : "Sin rol"}
          </div>
          <Link href="/ovj" className="inline-flex items-center gap-2 text-white/80 hover:text-white">
            <ArrowLeft size={14} /> Volver a OVJ
          </Link>
        </div>
      </aside>

      <div className="ml-64 min-h-screen">
        <header className="border-b border-[#dce7ee] bg-white/80 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#0F69B4]">Mi Fiscalía en Línea</p>
              <h1 className="text-2xl font-black text-[#11314d]">{title}</h1>
            </div>
            <div className="rounded-sm bg-[#EB3C46] px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white">
              Fiscalía
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
