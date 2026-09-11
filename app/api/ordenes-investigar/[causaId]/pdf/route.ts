import { prisma } from "@/lib/prisma";
import { PDFDocument } from "pdf-lib";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { nombreLegal, formatearRut } from "@/lib/identidad";
import { crearConstructorPdf, fechaCorta, POLICIA_TEXTO } from "@/lib/pdfLayout";
import { DILIGENCIAS_ORDEN_INVESTIGAR, URGENCIA_TEXTO } from "@/lib/diligencias";

export const dynamic = "force-dynamic";
const FISCALIA_GENERICA = "Fiscalía Local";

export async function GET(_request: Request, { params }: { params: { causaId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const causa = await prisma.causa.findUnique({ where: { id: params.causaId }, include: { fiscal: true, ordenInvestigar: true } });
  if (!causa) return NextResponse.json({ error: "Causa no encontrada" }, { status: 404 });
  const orden = causa.ordenInvestigar;
  if (!orden) return NextResponse.json({ error: "Esta causa no tiene una orden de investigar generada" }, { status: 404 });

  const pdf = await PDFDocument.create();
  const doc = await crearConstructorPdf(pdf);
  const fiscalia = orden.fiscalia || FISCALIA_GENERICA;
  const imputado = orden.imputadoIndividualizado
    ? `${orden.imputadoNombre || "persona no individualizada"}${orden.imputadoRut ? `, RUN/Pasaporte ${formatearRut(orden.imputadoRut)}` : ""}`
    : "persona o personas por individualizar";
  const diligencias = DILIGENCIAS_ORDEN_INVESTIGAR.filter((d) => orden.diligencias.includes(d.codigo)).map((d) => d.texto);
  if (orden.diligenciasOtras) diligencias.push(orden.diligenciasOtras);

  doc.encabezadoOficio("Fiscalía", `RUC: ${causa.ruc ?? causa.rit}`, "ORDEN DE INVESTIGAR");
  doc.fichaOficio([
    { etiqueta: "Fecha de emisión", valor: fechaCorta(orden.emitidaEn) },
    { etiqueta: "Unidad diligencial", valor: POLICIA_TEXTO[orden.unidadPolicial] ?? orden.unidadPolicial },
    { etiqueta: "Fiscalía emisora", valor: fiscalia },
    { etiqueta: "Delito investigado", valor: causa.delito },
  ]);

  doc.tituloSeccion("Individualización", "Personas relacionadas");
  doc.fichaOficio([
    { etiqueta: "Víctima / denunciante", valor: orden.victimaNombre || "Identidad reservada o no aplicable" },
    { etiqueta: "Imputado/a", valor: imputado },
  ]);

  doc.tituloSeccion("Vistos", "Antecedentes");
  doc.parrafo(`1. La investigación RIT ${causa.rit}, seguida por el delito de ${causa.delito}.`);
  doc.parrafo(`2. Los antecedentes disponibles, de los cuales aparece como víctima ${orden.victimaNombre || "identidad reservada o no aplicable"} y como imputado(a) ${imputado}.`);
  doc.parrafo(`3. La relación de hechos que da origen a la investigación: ${causa.descripcion}.`);

  doc.tituloSeccion("Considerando", "Fundamentos");
  doc.parrafo(`Primero: Que corresponde al Ministerio Público dirigir la investigación de los hechos constitutivos de delito y disponer las actuaciones necesarias para su esclarecimiento.`);
  doc.parrafo(`Segundo: Que las diligencias que se ordenan resultan pertinentes para determinar la existencia del hecho investigado y la participación que pudiere corresponder.`);
  doc.parrafo(`Tercero: Que la unidad destinataria será ${POLICIA_TEXTO[orden.unidadPolicial] ?? orden.unidadPolicial}.`);

  doc.tituloSeccion("Por tanto", "Se ordena");
  doc.subtitulo("Diligencias investigativas");
  if (diligencias.length) {
    diligencias.forEach((diligencia, index) => doc.parrafo(`${index + 1}. ${diligencia}`));
  } else {
    doc.parrafo("Practíquense las diligencias investigativas generales de rigor, conforme a los antecedentes de la causa.");
  }
  doc.subtitulo("Condiciones de cumplimiento");
  doc.fichaOficio([
    { etiqueta: "Urgencia", valor: URGENCIA_TEXTO[orden.urgencia] ?? orden.urgencia },
    { etiqueta: "Plazo para informar", valor: orden.plazoInforme || "A la brevedad posible" },
    { etiqueta: "Forma de remisión", valor: orden.formaRemision || "Oficio" },
    { etiqueta: "Instrucciones", valor: orden.instrucciones || "Sin instrucciones particulares adicionales" },
  ]);
  doc.parrafo("Toda diligencia que prive o restrinja derechos garantizados requerirá la autorización judicial previa que corresponda.", 8.5, doc.italic);

  doc.avanzar(-18);
  doc.espacioDisponible(75);
  doc.bloqueFirmas([
    { nombre: nombreLegal(causa.fiscal), etiqueta: "Fiscal instructor" },
    { nombre: orden.funcionarioPolicialNombre, etiqueta: "Funcionario policial que recibe la orden" },
  ]);
  doc.piePagina(`Causa RIT ${causa.rit} · Orden de investigar`);

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="orden-investigar-${causa.rit}.pdf"` } });
}
