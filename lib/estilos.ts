export const ESTILO_ESTADO_CAUSA: Record<string, string> = {
  EN_INVESTIGACION: "bg-slate-800 text-hueso",
  FORMALIZADA: "bg-blue-700 text-white",
  EN_ESPERA_JUICIO: "bg-amber-500 text-marino-950",
  EN_JUICIO: "bg-blue-600 text-white",
  EN_APELACION: "bg-purple-700 text-white",
  SENTENCIADA: "bg-emerald-700 text-white",
  CERRADA: "bg-grafito/25 text-grafito",
  ARCHIVADA: "bg-grafito/25 text-grafito",
  SOBRESEIDA: "bg-grafito/25 text-grafito",
};

export const ESTILO_ESTADO_CERTIFICACION: Record<string, string> = {
  PENDIENTE: "bg-amber-100 text-amber-800",
  APROBADA: "bg-emerald-100 text-emerald-800",
  RECHAZADA: "bg-red-100 text-red-800",
  SUSPENDIDA: "bg-grafito/10 text-grafito/60",
};

export const ESTILO_ESTADO_ORDEN: Record<string, string> = {
  VIGENTE: "bg-red-100 text-red-700",
  EJECUTADA: "bg-emerald-100 text-emerald-800",
  LEVANTADA: "bg-grafito/10 text-grafito/60",
};

export function etiquetaEstado(estado: string) {
  return estado.replace(/_/g, " ");
}
