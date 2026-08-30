// ID de Discord con rango exclusivo de Presidente de la Corte Suprema.
// Conserva el rol ADMIN a nivel de permisos (mismos accesos que la Corte Suprema),
// pero se identifica y se muestra distinto en toda la interfaz.
export const DISCORD_ID_PRESIDENTE = "1335396733152264264";

export function esPresidenteCorteSuprema(discordId?: string | null): boolean {
  return discordId === DISCORD_ID_PRESIDENTE;
}

// ID de Discord con cargo exclusivo de Fiscal Regional dentro del Ministerio Público.
// Conserva el rol FISCAL a nivel de permisos (mismos accesos que un fiscal adjunto),
// pero se identifica y se muestra distinto en toda la interfaz (incluida la credencial).
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

/** Nombre a mostrar en documentos oficiales: prioriza el nombre IC sobre el de Discord. */
export function nombreLegal(u: UsuarioConIdentidad | null | undefined): string {
  if (!u) return "Sin identificar";
  return u.nombreIC?.trim() || u.name?.trim() || "Sin nombre registrado";
}

/** True si el usuario ya completó los datos mínimos para figurar en documentos oficiales. */
export function identidadCompleta(u: UsuarioConIdentidad | null | undefined): boolean {
  return Boolean(u?.nombreIC?.trim() && u?.rut?.trim());
}

// Roles considerados "funcionarios del Estado" para efectos de la identificación oficial.
// Los abogados quedan fuera a propósito: son profesionales particulares, no funcionarios,
// y ya cuentan con su propio certificado de habilitación.
export const ROLES_FUNCIONARIOS = ["ADMIN", "JUEZ", "FISCAL", "FUNCIONARIO"];

export const INSTITUCION_POR_ROL: Record<string, string> = {
  ADMIN: "Corte Suprema",
  JUEZ: "Poder Judicial",
  FISCAL: "Ministerio Público",
  FUNCIONARIO: "Orden y Seguridad",
};

/** Formatea un RUT chileno simple (12345678-9) agregando puntos de miles. */
export function formatearRut(rut: string): string {
  const limpio = rut.replace(/\./g, "").trim();
  const [numero, dv] = limpio.split("-");
  if (!numero || !dv) return rut;
  const conPuntos = numero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${conPuntos}-${dv.toUpperCase()}`;
}

/** Genera un NIF único para fiscales. */
export function generarNifFiscal(userId: string): string {
  const base = (userId || "FISCAL").replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase();
  const anio = new Date().getFullYear();
  return `NIF-${anio}-${base.padStart(8, "0")}`;
}