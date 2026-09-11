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
  Bell,
  CalendarDays,
  ClipboardList,
  FileBarChart,
  Hammer,
  Building2,
  UserRound,
  DoorOpen,
} from "lucide-react";
import NavLinks, { type NavItem } from "./NavLinks";

// Instanciamos los íconos como JSX (<Icono size={15} />) para que sean 100% serializables
const NAV_POR_ROL: Record<string, NavItem[]> = {
  INVITADO: [],
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
    { href: "/denuncias/nueva", label: "Presentar denuncia", icon: <FilePlus2 size={15} /> },
    { href: "/perfil", label: "Mi perfil", icon: <Fingerprint size={15} /> },
  ],
  JUEZ: [
    { href: "/dashboard/juez", label: "Mis causas", icon: <Gavel size={15} /> },
    { href: "/portal/notificaciones", label: "Mis notificaciones", icon: <Bell size={15} /> },
    { href: "/portal/audiencias", label: "Mis audiencias", icon: <CalendarDays size={15} /> },
    { href: "/portal/estado-diario", label: "Mi estado diario", icon: <ClipboardList size={15} /> },
    { href: "/portal/certificado-desempeno", label: "Certificado de desempeño", icon: <FileBarChart size={15} /> },
    { href: "/portal/remates", label: "Remates", icon: <Hammer size={15} /> },
    { href: "/portal/transparencia", label: "Transparencia institucional", icon: <Building2 size={15} /> },
    { href: "/portal/consulta-ciudadana", label: "Consulta ciudadana", icon: <UserRound size={15} /> },
    { href: "/portal/salas", label: "Programación de salas", icon: <DoorOpen size={15} /> },
    { href: "/perfil", label: "Mis datos / 2da clave", icon: <Fingerprint size={15} /> },
    { href: "/causas", label: "Todas las causas", icon: <Scale size={15} /> },
    { href: "/ingreso-causas", label: "Ing. demandas y escritos", icon: <FilePlus2 size={15} /> },
    { href: "/consulta", label: "Consulta unificada", icon: <Scale size={15} /> },
    { href: "/portal/consulta-audiencias", label: "Consulta audiencias", icon: <CalendarDays size={15} /> },
    { href: "/escritos", label: "Escritos", icon: <ScrollText size={15} /> },
    { href: "/abogados", label: "Abogados certificados", icon: <Award size={15} /> },
    { href: "/perfil", label: "Mi perfil", icon: <Fingerprint size={15} /> },
    { href: "/denuncias/nueva", label: "Presentar denuncia", icon: <FilePlus2 size={15} /> },
  ],
  FISCAL: [
    { href: "/dashboard/fiscal", label: "Mis causas", icon: <Users size={15} /> },
    { href: "/portal/notificaciones", label: "Mis notificaciones", icon: <Bell size={15} /> },
    { href: "/portal/audiencias", label: "Mis audiencias", icon: <CalendarDays size={15} /> },
    { href: "/portal/estado-diario", label: "Mi estado diario", icon: <ClipboardList size={15} /> },
    { href: "/portal/certificado-desempeno", label: "Certificado de desempeño", icon: <FileBarChart size={15} /> },
    { href: "/portal/remates", label: "Remates", icon: <Hammer size={15} /> },
    { href: "/portal/transparencia", label: "Transparencia institucional", icon: <Building2 size={15} /> },
    { href: "/portal/consulta-ciudadana", label: "Consulta ciudadana", icon: <UserRound size={15} /> },
    { href: "/portal/salas", label: "Programación de salas", icon: <DoorOpen size={15} /> },
    { href: "/perfil", label: "Mis datos / 2da clave", icon: <Fingerprint size={15} /> },
    { href: "/causas", label: "Todas las causas", icon: <Scale size={15} /> },
    { href: "/causas/nueva", label: "Registrar causa", icon: <FilePlus2 size={15} /> },
    { href: "/actas/detenido", label: "Adjuntar acta de derechos", icon: <FilePlus2 size={15} /> },
    { href: "/denuncias", label: "Denuncias", icon: <FilePlus2 size={15} /> },
    { href: "/escritos", label: "Escritos", icon: <ScrollText size={15} /> },
    { href: "/ingreso-causas", label: "Ing. demandas y escritos", icon: <FilePlus2 size={15} /> },
    { href: "/consulta", label: "Consulta unificada", icon: <Scale size={15} /> },
    { href: "/portal/consulta-audiencias", label: "Consulta audiencias", icon: <CalendarDays size={15} /> },
    { href: "/abogados", label: "Abogados certificados", icon: <Award size={15} /> },
    { href: "/perfil", label: "Mi perfil", icon: <Fingerprint size={15} /> },
    { href: "/denuncias/nueva", label: "Presentar denuncia", icon: <FilePlus2 size={15} /> },
  ],
  ABOGADO: [
    { href: "/dashboard/abogado", label: "Mis defensas", icon: <ShieldCheck size={15} /> },
    { href: "/causas", label: "Causas disponibles", icon: <Scale size={15} /> },
    { href: "/escritos", label: "Escritos", icon: <ScrollText size={15} /> },
    { href: "/dashboard/abogado/certificacion", label: "Mi certificación", icon: <BadgeCheck size={15} /> },
    { href: "/abogados", label: "Abogados certificados", icon: <Award size={15} /> },
    { href: "/perfil", label: "Mi perfil", icon: <Fingerprint size={15} /> },
    { href: "/denuncias/nueva", label: "Presentar denuncia", icon: <FilePlus2 size={15} /> },
  ],
  FUNCIONARIO: [
    { href: "/dashboard/funcionario", label: "Panel funcionario", icon: <LayoutDashboard size={15} /> },
    { href: "/portal/notificaciones", label: "Mis notificaciones", icon: <Bell size={15} /> },
    { href: "/portal/audiencias", label: "Mis audiencias", icon: <CalendarDays size={15} /> },
    { href: "/portal/estado-diario", label: "Mi estado diario", icon: <ClipboardList size={15} /> },
    { href: "/portal/certificado-desempeno", label: "Certificado de desempeño", icon: <FileBarChart size={15} /> },
    { href: "/portal/remates", label: "Remates", icon: <Hammer size={15} /> },
    { href: "/portal/transparencia", label: "Transparencia institucional", icon: <Building2 size={15} /> },
    { href: "/portal/consulta-ciudadana", label: "Consulta ciudadana", icon: <UserRound size={15} /> },
    { href: "/portal/salas", label: "Programación de salas", icon: <DoorOpen size={15} /> },
    { href: "/perfil", label: "Mis datos / 2da clave", icon: <Fingerprint size={15} /> },
    { href: "/ordenes-captura", label: "Órdenes de captura", icon: <Gavel size={15} /> },
    { href: "/consulta", label: "Consulta unificada", icon: <Scale size={15} /> },
    { href: "/portal/consulta-audiencias", label: "Consulta audiencias", icon: <CalendarDays size={15} /> },
    { href: "/actas/detenido", label: "Acta de derechos", icon: <FilePlus2 size={15} /> },
    { href: "/consulta", label: "Consulta pública", icon: <Scale size={15} /> },
    { href: "/perfil", label: "Mi perfil", icon: <Fingerprint size={15} /> },
  ],
  CIUDADANO: [
    { href: "/dashboard/parte", label: "Mis causas", icon: <Scale size={15} /> },
    { href: "/portal/notificaciones", label: "Mis notificaciones", icon: <Bell size={15} /> },
    { href: "/portal/audiencias", label: "Mis audiencias", icon: <CalendarDays size={15} /> },
    { href: "/portal/estado-diario", label: "Mi estado diario", icon: <ClipboardList size={15} /> },
    { href: "/portal/certificado-desempeno", label: "Certificado de desempeño", icon: <FileBarChart size={15} /> },
    { href: "/portal/remates", label: "Remates", icon: <Hammer size={15} /> },
    { href: "/portal/transparencia", label: "Transparencia institucional", icon: <Building2 size={15} /> },
    { href: "/portal/consulta-ciudadana", label: "Consulta ciudadana", icon: <UserRound size={15} /> },
    { href: "/portal/salas", label: "Programación de salas", icon: <DoorOpen size={15} /> },
    { href: "/perfil", label: "Mis datos / 2da clave", icon: <Fingerprint size={15} /> },
    { href: "/consulta", label: "Consulta unificada", icon: <Scale size={15} /> },
    { href: "/portal/consulta-audiencias", label: "Consulta audiencias", icon: <CalendarDays size={15} /> },
    { href: "/abogados", label: "Abogados certificados", icon: <Award size={15} /> },
    { href: "/perfil", label: "Mi perfil", icon: <Fingerprint size={15} /> },
    { href: "/denuncias/nueva", label: "Presentar denuncia", icon: <FilePlus2 size={15} /> },
  ],
};

const NAV_OJV: NavItem[] = [
  { href: "/portal/notificaciones", label: "Mis notificaciones", icon: <Bell size={15} /> },
  { href: "/portal/audiencias", label: "Mis audiencias", icon: <CalendarDays size={15} /> },
  { href: "/portal/estado-diario", label: "Mi estado diario", icon: <ClipboardList size={15} /> },
  { href: "/portal/certificado-desempeno", label: "Mi certificado de desempeño", icon: <FileBarChart size={15} /> },
  { href: "/portal/remates", label: "Remates", icon: <Hammer size={15} /> },
  { href: "/ingreso-causas", label: "Ing. demandas y escritos", icon: <FilePlus2 size={15} /> },
  { href: "/consulta", label: "Consulta unificada", icon: <Scale size={15} /> },
  { href: "/portal/consulta-audiencias", label: "Consulta audiencias", icon: <CalendarDays size={15} /> },
  { href: "/portal/transparencia", label: "Transparencia institucional", icon: <Building2 size={15} /> },
  { href: "/portal/consulta-ciudadana", label: "Consulta ciudadana", icon: <UserRound size={15} /> },
  { href: "/portal/salas", label: "Programación de salas", icon: <DoorOpen size={15} /> },
  { href: "/perfil", label: "Mis datos / 2da clave", icon: <Fingerprint size={15} /> },
];

const NOMBRE_VISUAL_ROL: Record<string, string> = {
  INVITADO: "Invitado",
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
  const misCausas: Record<string, NavItem> = {
    ADMIN: { href: "/causas", label: "Mis causas", icon: <Scale size={15} /> },
    JUEZ: { href: "/dashboard/juez", label: "Mis causas", icon: <Gavel size={15} /> },
    FISCAL: { href: "/dashboard/fiscal", label: "Mis causas", icon: <Users size={15} /> },
    ABOGADO: { href: "/dashboard/abogado", label: "Mis causas", icon: <ShieldCheck size={15} /> },
    FUNCIONARIO: { href: "/dashboard/funcionario", label: "Mis causas", icon: <LayoutDashboard size={15} /> },
    CIUDADANO: { href: "/dashboard/parte", label: "Mis causas", icon: <Scale size={15} /> },
  };
  const items = rol === "INVITADO"
      ? NAV_POR_ROL.INVITADO
      : [misCausas[rol] ?? misCausas.CIUDADANO, ...NAV_OJV];

  // La identidad de Presidente se determina por el usuario real de la sesión
  // (no por el prop "rol", que puede reflejar una vista "ver como X" del admin).
  const session = await getServerSession(authOptions);
  const esPresidente = esPresidenteCorteSuprema((session?.user as any)?.discordId);

  const nombreRol = esPresidente ? "Presidente Corte Suprema" : NOMBRE_VISUAL_ROL[rol] ?? rol;

  const bloqueMisCausas = {
    ADMIN: [
      { href: "/causas", label: "Causas a mi cargo" },
    ],
    JUEZ: [
      { href: "/dashboard/juez", label: "Causas a mi cargo" },
    ],
    FISCAL: [
      { href: "/dashboard/fiscal", label: "Causas a mi cargo" },
      { href: "/causas/nueva", label: "Registrar causa" },
    ],
    ABOGADO: [
      { href: "/dashboard/abogado", label: "Causas a mi cargo" },
    ],
    FUNCIONARIO: [
      { href: "/dashboard/funcionario", label: "Causas a mi cargo" },
    ],
    CIUDADANO: [
      { href: "/dashboard/parte", label: "Causas a mi cargo" },
    ],
  }[rol] ?? [{ href: "/dashboard/parte", label: "Causas a mi cargo" }];

  return (
    <div className="judicial-shell">
      <aside className="judicial-sidebar">
        <Link href="/dashboard" className="judicial-brand">
          <div className="judicial-brand-mark"><Scale size={31} strokeWidth={1.5} /></div>
          <p>PODER JUDICIAL</p>
          <span>REPÚBLICA DE CHILE</span>
        </Link>
        <div className="judicial-sidebar-links"><NavLinks items={items} /></div>
        {rol !== "INVITADO" && <div className="judicial-sidebar-footer">
          <div className="judicial-role-pill">
            {esPresidente ? <Crown size={16} /> : <span>{nombreRol.charAt(0)}</span>}
            <strong>{nombreRol}</strong>
          </div>
          <Link href="/api/auth/signout" className="judicial-signout"><LogOut size={14} /> Cerrar sesión</Link>
        </div>}
      </aside>

      <div className="judicial-main">
        <header className="judicial-topbar">
          <button className="judicial-menu-button" aria-label="Abrir menú">☰</button>
          <div className="judicial-breadcrumb"><Link href="/dashboard">⌂</Link><span>/</span><span>{titulo}</span></div>
          <div className="judicial-user-chip">◉ {nombreRol}</div>
        </header>
        <main className="judicial-content">
          {rol !== "INVITADO" && (
            <section className="mb-6 overflow-hidden rounded-2xl border border-[#dfe6ed] bg-[#f4f7f9] shadow-sm">
              <div className="flex w-full border-b border-[#dfe6ed] bg-[#dfe6ed]/40">
                {bloqueMisCausas.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex-1 px-4 py-3 text-center text-sm font-semibold transition ${
                      index === 0
                        ? "bg-[#6d8b4d] text-white"
                        : "bg-transparent text-[#0d2436] hover:bg-[#edf3f7]"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </section>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
