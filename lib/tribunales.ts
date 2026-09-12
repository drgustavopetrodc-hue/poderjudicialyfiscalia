export const COMPETENCIAS = [
  "JUZGADO_DE_GARANTIA",
  "JUZGADO_ORAL_EN_LO_PENAL",
  "TRIBUNAL_ORDINARIO",
  "CORTE_DE_APELACIONES",
] as const;

export type Competencia = (typeof COMPETENCIAS)[number];

export const ETIQUETAS_COMPETENCIA: Record<Competencia, string> = {
  JUZGADO_DE_GARANTIA: "Juzgado de Garantía",
  JUZGADO_ORAL_EN_LO_PENAL: "Juzgado Oral en lo Penal",
  TRIBUNAL_ORDINARIO: "Tribunal ordinario",
  CORTE_DE_APELACIONES: "Corte de Apelaciones",
};

export const TRIBUNALES_ARICA: Record<Competencia, readonly string[]> = {
  JUZGADO_DE_GARANTIA: [
    "Primer Juzgado de Garantía de Arica",
    "Segundo Juzgado de Garantía de Arica",
  ],
  JUZGADO_ORAL_EN_LO_PENAL: [
    "Primer Juzgado Oral en lo Penal de Arica",
    "Segundo Juzgado Oral en lo Penal de Arica",
  ],
  TRIBUNAL_ORDINARIO: [
    "Primer Juzgado Ordinario de Arica",
    "Segundo Juzgado Ordinario de Arica",
  ],
  CORTE_DE_APELACIONES: [
    "Primer Tribunal de la Corte de Apelaciones de Arica",
    "Segundo Tribunal de la Corte de Apelaciones de Arica",
  ],
};

export const TRIBUNALES_VALIDOS = new Set(Object.values(TRIBUNALES_ARICA).flat());

export function anioActual() {
  return new Date().getFullYear();
}
