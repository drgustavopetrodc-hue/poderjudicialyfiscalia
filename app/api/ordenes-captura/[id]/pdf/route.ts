import { prisma } from "@/lib/prisma";
import { PDFDocument } from "pdf-lib";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { nombreLegal, formatearRut } from "@/lib/identidad";
import { crearConstructorPdf, fechaCorta, POLICIA_TEXTO } from "@/lib/pdfLayout";

export const dynamic = "force-dynamic";

const TRIBUNAL_GENERICO = "Tribunal de Garantía y Juicio Oral en lo Penal de la jurisdicción correspondiente";
const CAUSAL_LEGAL_TEXTO: Record<string, string> = {
  ART_127: "artículo 127 del Código Procesal Penal",
  ART_128: "artículo 128 del Código Procesal Penal",
  ART_33: "artículo 33 del Código Procesal Penal",
  ART_129: "artículo 129 del Código Procesal Penal",
  REBELDIA: "la incomparecencia injustificada a audiencia",
  OTRO: "la causal indicada en los antecedentes",
};

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orden = await prisma.ordenCaptura.findUnique({
    where: { id: params.id },
    include: { causa: { include: { fiscal: true, juez: true } }, solicitadoPor: true },
  });
  if (!orden) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  const pdf = await PDFDocument.create();
  const doc = await crearConstructorPdf(pdf);
  const causa = orden.causa;
  const nombreJuez = causa.juez ? nombreLegal(causa.juez) : nombreLegal(orden.solicitadoPor);
  const tribunal = causa.tribunal || TRIBUNAL_GENERICO;
  const individualizacion = `${orden.nombrePersona}, ${orden.runOPasaporte ? `RUN/Pasaporte ${formatearRut(orden.runOPasaporte)}, ` : ""}${orden.nacionalidadPersona ? `de nacionalidad ${orden.nacionalidadPersona}, ` : ""}${orden.fechaNacimiento ? `nacido(a) el ${orden.fechaNacimiento}, ` : ""}${orden.domicilioConocido ? `con domicilio conocido en ${orden.domicilioConocido}` : "demás antecedentes desconocidos"}`;
  const causal = orden.causalLegal === "OTRO" && orden.causalLegalOtro ? orden.causalLegalOtro : CAUSAL_LEGAL_TEXTO[orden.causalLegal];

  doc.encabezadoOficio("Poder Judicial", `RIT: ${causa.rit}`, "ORDEN DE DETENCIÓN Y CAPTURA");
  doc.fichaOficio([
    { etiqueta: "Fecha de emisión", valor: fechaCorta(orden.emitidaEn) },
    { etiqueta: "Tribunal", valor: tribunal },
    { etiqueta: "RUC", valor: causa.ruc ?? "No registrado" },
    { etiqueta: "Fiscal a cargo", valor: nombreLegal(causa.fiscal) },
    { etiqueta: "Imputado/a", valor: orden.nombrePersona },
    { etiqueta: "Delito investigado", valor: causa.delito },
  ]);

  doc.tituloSeccion("Individualización", "Persona requerida");
  doc.fichaOficio([
    { etiqueta: "Nombre completo", valor: orden.nombrePersona },
    { etiqueta: "RUN / Pasaporte", valor: orden.runOPasaporte ? formatearRut(orden.runOPasaporte) : "No informado" },
    { etiqueta: "Nacionalidad", valor: orden.nacionalidadPersona || "No informada" },
    { etiqueta: "Fecha de nacimiento", valor: orden.fechaNacimiento || "No informada" },
    { etiqueta: "Domicilio conocido", valor: orden.domicilioConocido || "No informado" },
    { etiqueta: "Señas particulares", valor: orden.senasParticulares || "No informadas" },
  ]);

  doc.tituloSeccion("Vistos", "Antecedentes de la causa");
  doc.parrafo(`1. La causa RIT ${causa.rit}, seguida por el delito de ${causa.delito}, cuya investigación se encuentra a cargo de ${nombreLegal(causa.fiscal)}.`);
  doc.parrafo(`2. La solicitud de orden de detención y captura respecto de la persona individualizada en esta resolución: ${individualizacion}.`);
  doc.parrafo(`3. Los antecedentes expuestos por quien solicita la medida: ${orden.motivo}.`);

  doc.tituloSeccion("Considerando", "Fundamentos de la resolución");
  doc.parrafo(`Primero: Que los antecedentes acompañados permiten disponer la medida solicitada, conforme a ${causal}.`);
  doc.parrafo(`Segundo: Que la necesidad de cautela se fundamenta en lo siguiente: ${orden.fundamentoCautela || "la comparecencia de la persona requerida y el adecuado desarrollo de la investigación"}.`);
  doc.parrafo(`Tercero: Que la persona requerida ha sido individualizada como ${individualizacion}.`);

  doc.tituloSeccion("Por tanto", "Se resuelve");
  doc.parrafo(`SE ORDENA la detención y captura de ${orden.nombrePersona}, ya individualizado(a), debiendo ser puesto(a) a disposición de este tribunal dentro de las veinticuatro horas siguientes a su detención, o dentro del plazo que corresponda conforme a la normativa aplicable.`, 10, doc.bold);
  doc.fichaOficio([
    { etiqueta: "Policía instruida", valor: POLICIA_TEXTO[orden.policiaInstruida] ?? orden.policiaInstruida },
    { etiqueta: "Vigencia", valor: orden.vigenciaOrden },
    { etiqueta: "Estado", valor: `${orden.estado}${orden.levantadaEn ? ` · Levantada el ${fechaCorta(orden.levantadaEn)}` : ""}` },
  ]);
  doc.parrafo("REGÍSTRESE en los sistemas institucionales pertinentes.");

  doc.avanzar(-18);
  doc.espacioDisponible(75);
  doc.bloqueFirmas([
    { nombre: nombreJuez, etiqueta: "Juez/a" },
    { nombre: orden.secretarioNombre, etiqueta: "Ministro de fe / Secretario/a" },
  ]);
  doc.piePagina(`Resolución RIT ${causa.rit} · ID de orden ${orden.id}`);

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="orden-deteccion-${causa.rit}.pdf"` } });
}
