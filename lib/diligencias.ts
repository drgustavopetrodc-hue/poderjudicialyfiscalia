export const DILIGENCIAS_ORDEN_INVESTIGAR: { codigo: string; texto: string }[] = [
  { codigo: "DECLARACION_TESTIGOS", texto: "Toma de declaración a testigo(s)" },
  { codigo: "DECLARACION_VICTIMA", texto: "Toma de declaración a la víctima" },
  { codigo: "CITACION_IMPUTADO", texto: "Citación e interrogatorio del imputado (con las prevenciones del art. 93 CPP)" },
  { codigo: "SITIO_SUCESO", texto: "Levantamiento de sitio del suceso y fijación fotográfica" },
  { codigo: "CUSTODIA_EVIDENCIA", texto: "Recolección y custodia de evidencia física (cadena de custodia, art. 181 CPP)" },
  { codigo: "PERITAJES", texto: "Peritajes (balístico / dactiloscópico / químico / informático / otro)" },
  { codigo: "INFORMES_INSTITUCIONES", texto: "Solicitud de informes a instituciones (Registro Civil, SML, hospitales, bancos, etc.)" },
  { codigo: "ANTECEDENTES_PENALES", texto: "Verificación de antecedentes penales del imputado (extracto de filiación)" },
  { codigo: "UBICACION_SOSPECHOSOS", texto: "Individualización y ubicación de testigos o sospechosos" },
  { codigo: "VIDEOVIGILANCIA", texto: "Obtención de registros de videovigilancia" },
  { codigo: "VIGILANCIA_SEGUIMIENTO", texto: "Diligencias de vigilancia y seguimiento (sin afectar derechos que requieran autorización judicial previa)" },
];

export const URGENCIA_TEXTO: Record<string, string> = {
  ORDINARIA: "Ordinaria",
  CON_DETENIDO: "Con detenido (plazo art. 131 CPP)",
  SUMA_URGENCIA: "Suma urgencia",
};
