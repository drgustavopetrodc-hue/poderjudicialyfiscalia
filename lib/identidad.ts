


export const DISCORD_IDS_PRESIDENTE = ["1335396733152264264", "1387545786585321535"] as const;
export const DISCORD_ID_PRESIDENTE = DISCORD_IDS_PRESIDENTE[0];
export const DISCORD_ID_PRESIDENTE_CORTE = DISCORD_IDS_PRESIDENTE[1];

export function esPresidenteCorteSuprema(discordId?: string | null): boolean {
  return !!discordId && DISCORD_IDS_PRESIDENTE.includes(discordId as (typeof DISCORD_IDS_PRESIDENTE)[number]);
}


export function discordIdIdentidadCanonica(discordId?: string | null): string | null {
  return esPresidenteCorteSuprema(discordId) ? DISCORD_ID_PRESIDENTE : discordId ?? null;
}




export const DISCORD_ID_FISCAL_REGIONAL = "821164300386435102";

export function esFiscalRegional(discordId?: string | null): boolean {
  return discordId === DISCORD_ID_FISCAL_REGIONAL;
}

type UsuarioConIdentidad = {
  name?: string | null;
  nombreIC?: string | null;
  rut?: string | null;
  nacionalidad?: string | null;
};


export function nombreLegal(u: UsuarioConIdentidad | null | undefined): string {
  if (!u) return "Sin identificar";
  return u.nombreIC?.trim() || u.name?.trim() || "Sin nombre registrado";
}


export function identidadCompleta(u: UsuarioConIdentidad | null | undefined): boolean {
  return Boolean(u?.nombreIC?.trim() && u?.rut?.trim());
}




export const ROLES_FUNCIONARIOS = ["ADMIN", "JUEZ", "FISCAL", "FUNCIONARIO"];

export const INSTITUCION_POR_ROL: Record<string, string> = {
  ADMIN: "Corte Suprema",
  JUEZ: "Poder Judicial",
  FISCAL: "Ministerio Público",
  FUNCIONARIO: "Orden y Seguridad",
};


export function formatearRut(rut: string): string {
  const limpio = rut.replace(/\./g, "").trim();
  const [numero, dv] = limpio.split("-");
  if (!numero || !dv) return rut;
  const conPuntos = numero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${conPuntos}-${dv.toUpperCase()}`;
}


export function normalizarRut(rut: string): string {
  const limpio = rut.replace(/[.\-\s]/g, "").toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(limpio)) return rut.trim().toUpperCase();
  return `${limpio.slice(0, -1)}-${limpio.slice(-1)}`;
}


export function generarNifFiscal(userId: string): string {
  const base = (userId || "FISCAL").replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase();
  const anio = new Date().getFullYear();
  return `NIF-${anio}-${base.padStart(8, "0")}`;
}