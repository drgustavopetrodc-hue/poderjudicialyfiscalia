import Link from "next/link";

const NAV_POR_ROL: Record<string, { href: string; label: string }[]> = {
  ADMIN: [
    { href: "/dashboard/admin", label: "Panel general" },
    { href: "/causas", label: "Todas las causas" },
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

  return (
    <div className="min-h-screen bg-hueso flex">
      <aside className="w-64 bg-marino-950 text-hueso flex-shrink-0 p-6 hidden md:flex flex-col">
        <p className="font-mono text-dorado-400 text-xs tracking-[0.2em] uppercase mb-8">
          Poder Judicial RP
        </p>
        <nav className="flex flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-hueso/70 hover:text-hueso hover:bg-hueso/5 rounded-sm px-3 py-2 text-sm transition-colors"
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
        <header className="border-b border-grafito/10 px-8 py-6 bg-white">
          <p className="font-mono text-xs text-grafito/40 uppercase tracking-widest">{rol}</p>
          <h1 className="font-display text-2xl text-grafito">{titulo}</h1>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
