import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { esPresidenteCorteSuprema } from "@/lib/identidad";
import {
  LayoutDashboard,
  Scale,
  FilePlus2,
  Users,
  Gavel,
  ScrollText,
  Award,
  BadgeCheck,
  ShieldCheck,
  UserCog,
  LogOut,
  Fingerprint,
  Crown,
} from "lucide-react";
import NavLinks, { type NavItem } from "./NavLinks";

// Instanciamos los íconos como JSX (<Icono size={15} />) para que sean 100% serializables
const NAV_POR_ROL: Record<string, NavItem[]> = {
  ADMIN: [
    { href: "/dashboard/admin", label: "Panel general", icon: <LayoutDashboard size={15} /> },
    { href: "/causas", label: "Todas las causas", icon: <Scale size={15} /> },
    { href: "/causas/nueva", label: "Registrar causa (fiscal)", icon: <FilePlus2 size={15} /> },
    { href: "/dashboard/fiscal", label: "Ver como fiscal", icon: <Users size={15} /> },
    { href: "/dashboard/juez", label: "Ver como juez", icon: <Gavel size={15} /> },
    { href: "/dashboard/abogado", label: "Ver como abogado", icon: <ShieldCheck size={15} /> },
    { href: "/abogados", label: "Abogados certificados", icon: <Award size={15} /> },
    { href: "/escritos", label: "Escritos", icon: <ScrollText size={15} /> },
    { href: "/dashboard/admin/certificaciones", label: "Certificar abogados", icon: <BadgeCheck size={15} /> },
    { href: "/dashboard/admin/usuarios", label: "Usuarios y roles", icon: <UserCog size={15} /> },
    { href: "/consulta", label: "Consulta pública", icon: <Scale size={15} /> },
    { href: "/ordenes-captura", label: "Órdenes de captura", icon: <Gavel size={15} /> },
    { href: "/denuncias", label: "Denuncias", icon: <FilePlus2 size={15} /> },
    { href: "/perfil", label: "Mi perfil", icon: <Fingerprint size={15} /> },
  ],
  JUEZ: [
    { href: "/dashboard/juez", label: "Mis causas", icon: <Gavel size={15} /> },
    { href: "/causas", label: "Todas las causas", icon: <Scale size={15} /> },
    { href: "/escritos", label: "Escritos", icon: <ScrollText size={15} /> },
    { href: "/abogados", label: "Abogados certificados", icon: <Award size={15} /> },
    { href: "/perfil", label: "Mi perfil", icon: <Fingerprint size={15} /> },
  ],
  FISCAL: [
    { href: "/dashboard/fiscal", label: "Mi fiscalía", icon: <Users size={15} /> },
    { href: "/causas", label: "Todas las causas", icon: <Scale size={15} /> },
    { href: "/causas/nueva", label: "Registrar causa", icon: <FilePlus2 size={15} /> },
    { href: "/denuncias", label: "Denuncias", icon: <FilePlus2 size={15} /> },
    { href: "/escritos", label: "Escritos", icon: <ScrollText size={15} /> },
    { href: "/abogados", label: "Abogados certificados", icon: <Award size={15} /> },
    { href: "/perfil", label: "Mi perfil", icon: <Fingerprint size={15} /> },
  ],
  ABOGADO: [
    { href: "/dashboard/abogado", label: "Mis defensas", icon: <ShieldCheck size={15} /> },
    { href: "/causas", label: "Causas disponibles", icon: <Scale size={15} /> },
    { href: "/escritos", label: "Escritos", icon: <ScrollText size={15} /> },
    { href: "/dashboard/abogado/certificacion", label: "Mi certificación", icon: <BadgeCheck size={15} /> },
    { href: "/abogados", label: "Abogados certificados", icon: <Award size={15} /> },
    { href: "/perfil", label: "Mi perfil", icon: <Fingerprint size={15} /> },
  ],
  CIUDADANO: [
    { href: "/dashboard/parte", label: "Mis causas", icon: <Scale size={15} /> },
    { href: "/abogados", label: "Abogados certificados", icon: <Award size={15} /> },
    { href: "/perfil", label: "Mi perfil", icon: <Fingerprint size={15} /> },
  ],
};

const NOMBRE_VISUAL_ROL: Record<string, string> = {
  ADMIN: "Corte Suprema",
  JUEZ: "Juez",
  FISCAL: "Fiscal",
  ABOGADO: "Abogado",
  FUNCIONARIO: "Funcionario",
  CIUDADANO: "Ciudadano",
};

export default async function DashboardShell({
  rol,
  titulo,
  children,
}: {
  rol: string;
  titulo: string;
  children: React.ReactNode;
}) {
  const items = NAV_POR_ROL[rol] ?? NAV_POR_ROL.CIUDADANO;

  // La identidad de Presidente se determina por el usuario real de la sesión
  // (no por el prop "rol", que puede reflejar una vista "ver como X" del admin).
  const session = await getServerSession(authOptions);
  const esPresidente = esPresidenteCorteSuprema((session?.user as any)?.discordId);

  const nombreRol = esPresidente ? "Presidente Corte Suprema" : NOMBRE_VISUAL_ROL[rol] ?? rol;

  return (
    <div className="min-h-screen bg-hueso flex">
      <aside className="w-72 bg-marino-950 text-hueso shrink-0 p-6 hidden md:flex flex-col relative overflow-hidden">
        <div className="sello absolute inset-0 pointer-events-none" />
        <div className="grid-ornamento absolute inset-0 pointer-events-none opacity-40" />

        <Link href="/dashboard" className="relative flex items-center gap-3 mb-8 px-1 group">
          <div className="w-9 h-9 rounded-full border border-dorado-400/40 flex items-center justify-center shrink-0 bg-hueso/[0.04] group-hover:border-dorado-400/70 transition-colors">
            <Scale size={16} className="text-dorado-400" strokeWidth={1.75} />
          </div>
          <div>
            <p className="font-display text-base leading-none">Poder Judicial</p>
            <p className="font-mono text-dorado-400/70 text-[10px] tracking-[0.22em] uppercase mt-1">Sistema RP</p>
          </div>
        </Link>

        <div className="relative">
          <NavLinks items={items} />
        </div>

        <div className="relative pt-4 mt-4 border-t border-hueso/10">
          <div
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg mb-1 ${
              esPresidente ? "bg-dorado-400/10 border border-dorado-400/30" : "bg-hueso/[0.04]"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                esPresidente ? "bg-dorado-400/20 border-dorado-400/50" : "bg-dorado-400/15 border-dorado-400/30"
              }`}
            >
              {esPresidente ? (
                <Crown size={13} className="text-dorado-400" />
              ) : (
                <span className="font-mono text-dorado-400 text-[10px] font-bold">{nombreRol.charAt(0)}</span>
              )}
            </div>
            <p className="font-mono text-[10px] text-hueso/60 uppercase tracking-widest">{nombreRol}</p>
          </div>
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-2 text-hueso/40 text-xs hover:text-hueso/75 px-3 py-2 rounded-lg hover:bg-hueso/[0.04] transition-colors"
          >
            <LogOut size={13} /> Cerrar sesión
          </Link>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="border-b border-grafito/8 bg-white/85 backdrop-blur-md px-6 md:px-10 py-6 sticky top-0 z-10 shadow-[0_1px_0_rgba(11,21,38,.04)]">
          <p className="eyebrow text-blue-700/80 mb-1 flex items-center gap-1.5">
            {esPresidente && <Crown size={11} />} {nombreRol}
          </p>
          <h1 className="font-display text-2xl md:text-[28px] text-grafito tracking-tight">{titulo}</h1>
        </header>
        <main className="p-6 md:p-10 fade-up">{children}</main>
      </div>
    </div>
  );
}
