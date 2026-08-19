import Link from "next/link";

const NAV_POR_ROL: Record<string, { href: string; label: string }[]> = {
  ADMIN: [
    { href: "/dashboard/admin", label: "Panel general" },
    { href: "/causas", label: "Todas las causas" },
    { href: "/causas/nueva", label: "Registrar causa (como fiscal)" },
    { href: "/dashboard/fiscal", label: "Ver como fiscal" },
    { href: "/dashboard/juez", label: "Ver como juez" },
    { href: "/dashboard/abogado", label: "Ver como abogado" },
    { href: "/abogados", label: "Abogados certificados" },
    { href: "/escritos", label: "Escritos" },
    { href: "/dashboard/admin/certificaciones", label: "Certificar abogados" },
    { href: "/dashboard/admin/usuarios", label: "Usuarios y roles" },
  ],
  JUEZ: [
    { href: "/dashboard/juez", label: "Mis causas" },
    { href: "/causas", label: "Todas las causas" },
    { href: "/escritos", label: "Escritos" },
    { href: "/abogados", label: "Abogados certificados" },
  ],
  FISCAL: [
    { href: "/dashboard/fiscal", label: "Mis causas" },
    { href: "/causas", label: "Todas las causas" },
    { href: "/causas/nueva", label: "Registrar causa" },
    { href: "/escritos", label: "Escritos" },
    { href: "/abogados", label: "Abogados certificados" },
  ],
  ABOGADO: [
    { href: "/dashboard/abogado", label: "Mis defensas" },
    { href: "/causas", label: "Causas disponibles" },
    { href: "/escritos", label: "Escritos" },
    { href: "/dashboard/abogado/certificacion", label: "Mi certificación" },
    { href: "/abogados", label: "Abogados certificados" },
  ],
  CIUDADANO: [
    { href: "/dashboard/parte", label: "Mis causas" },
    { href: "/abogados", label: "Abogados certificados" },
  ],
};

const NOMBRE_VISUAL_ROL: Record<string, string> = {
  ADMIN: "CORTE SUPREMA",
  JUEZ: "JUEZ",
  FISCAL: "FISCAL",
  ABOGADO: "ABOGADO",
  FUNCIONARIO: "FUNCIONARIO",
  CIUDADANO: "CIUDADANO",
};

export default function DashboardShell({
  rol,
  titulo,
  children,
}: {
  rol: string;
  titulo: string;
  children: React.ReactNode;
}) {
  const items = NAV_POR_ROL[rol] ?? NAV_POR_ROL.CIUDADANO;
  const nombreRol = NOMBRE_VISUAL_ROL[rol] ?? rol;

  return (
    <div className="min-h-screen bg-hueso flex">
      <aside className="w-72 bg-marino-950 text-hueso flex-shrink-0 p-7 hidden md:flex flex-col">
        <p className="font-mono text-dorado-400 text-xs tracking-[0.2em] uppercase mb-8">
          Poder Judicial RP
        </p>
        <div className="mb-8 border-b border-hueso/10 pb-6">
          <p className="font-display text-2xl leading-none">Tribunal</p>
          <p className="mt-2 text-xs text-hueso/40">Sistema de justicia · RP</p>
        </div>
        <nav className="flex flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2.5 text-sm text-hueso/65 transition-colors hover:bg-hueso/10 hover:text-hueso"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <Link href="/api/auth/signout" className="text-hueso/40 text-xs hover:text-hueso/70">
            Cerrar sesión
          </Link>
        </div>
      </aside>

      <div className="flex-1">
        <header className="border-b border-grafito/10 bg-white px-8 py-7 shadow-[0_4px_18px_rgba(11,21,38,0.02)]">
          <p className="font-mono text-xs text-grafito/40 uppercase tracking-widest">{nombreRol}</p>
          <h1 className="font-display text-2xl text-grafito">{titulo}</h1>
        </header>
        <main className="p-6 lg:p-9">{children}</main>
      </div>
    </div>
  );
}
