import { prisma } from "@/lib/prisma";
import { PDFDocument } from "pdf-lib";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { nombreLegal, formatearRut } from "@/lib/identidad";
import { crearConstructorPdf, fechaCorta, POLICIA_TEXTO } from "@/lib/pdfLayout";
import { DILIGENCIAS_ORDEN_INVESTIGAR, URGENCIA_TEXTO } from "@/lib/diligencias";

export const dynamic = "force-dynamic";

const FISCALIA_GENERICA = "Fiscalía Local — Sistema RP";

export async function GET(_request: Request, { params }: { params: { causaId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const causa = await prisma.causa.findUnique({
    where: { id: params.causaId },
    include: { fiscal: true, ordenInvestigar: true },
  });
  if (!causa) return NextResponse.json({ error: "Causa no encontrada" }, { status: 404 });

  const orden = causa.ordenInvestigar;
  if (!orden) return NextResponse.json({ error: "Esta causa no tiene una orden de investigar generada" }, { status: 404 });

  const pdf = await PDFDocument.create();
  const doc = await crearConstructorPdf(pdf);

  doc.encabezado("ORDEN DE INVESTIGAR", "Conforme al Código Procesal Penal de Chile, art. 79° y ss., art. 180°, 181° y 187°");

  doc.tituloSeccion("I", "Datos de la fiscalía");
  doc.filaTabla("Fiscalía", orden.fiscalia || FISCALIA_GENERICA);
  doc.filaTabla("Fiscal a cargo", nombreLegal(causa.fiscal));
  doc.filaTabla("RUC", causa.ruc ?? "—");
  doc.filaTabla("Fecha de emisión", fechaCorta(orden.emitidaEn));
  doc.filaTabla("Unidad policial destinataria", POLICIA_TEXTO[orden.unidadPolicial] ?? orden.unidadPolicial);

  doc.tituloSeccion("II", "Antecedentes de la causa");
  doc.filaTabla("Delito(s) investigado(s)", causa.delito);
  doc.filaTabla("Víctima(s)", orden.victimaNombre || "N/A — identidad reservada o no aplica");
  doc.filaTabla(
    "Imputado(s) conocido(s)",
    orden.imputadoIndividualizado
      ? `${orden.imputadoNombre || "—"}${orden.imputadoRut ? ` · RUN/Pasaporte ${formatearRut(orden.imputadoRut)}` : ""}`
      : "Sujeto(s) por individualizar"
  );
  doc.subtitulo("Relación breve de los hechos");
  doc.parrafo(causa.descripcion, 10);

  doc.tituloSeccion("III", "Diligencias ordenadas");
  const seleccionadas = new Set(orden.diligencias);
  if (seleccionadas.size === 0 && !orden.diligenciasOtras) {
    doc.parrafo("No se especificaron diligencias particulares al momento de emitir esta orden; se instruye a la unidad policial actuar conforme a las diligencias generales de rigor (arts. 180 y 181 CPP).", 10, doc.italic);
  } else {
    for (const d of DILIGENCIAS_ORDEN_INVESTIGAR) {
      doc.casilla(seleccionadas.has(d.codigo), d.texto);
    }
    doc.casilla(Boolean(orden.diligenciasOtras), orden.diligenciasOtras ? `Otras: ${orden.diligenciasOtras}` : "Otras: —");
  }
  doc.avanzar(-2);
  doc.parrafo(
    "Nota: toda diligencia que prive o restrinja derechos garantizados por la Constitución (interceptación de comunicaciones, entrada y registro, incautación, etc.) requiere autorización judicial previa conforme al art. 9° CPP y debe tramitarse como solicitud aparte ante el Juzgado de Garantía.",
    8.5,
    doc.italic,
    undefined,
    0
  );

  doc.tituloSeccion("IV", "Plazo de cumplimiento");
  doc.filaTabla("Plazo para informar resultados", orden.plazoInforme || "A la brevedad posible");
  doc.filaTabla("Urgencia", URGENCIA_TEXTO[orden.urgencia] ?? orden.urgencia);
  doc.filaTabla("Forma de remisión del informe", orden.formaRemision || "Oficio");

  doc.tituloSeccion("V", "Instrucciones específicas al personal actuante");
  doc.parrafo(orden.instrucciones || "Sin instrucciones particulares adicionales.", 10);

  doc.tituloSeccion("VI", "Firma y certificación");
  doc.espacioDisponible(90);
  const colAncho = (doc.width - 48 * 2 - 24) / 2;
  doc.lineaDeFirma(48, colAncho, nombreLegal(causa.fiscal), "Fiscal instructor");
  doc.lineaDeFirma(48 + colAncho + 24, colAncho, orden.funcionarioPolicialNombre, "Funcionario policial que recibe la orden");
  doc.fijarY(doc.obtenerY() - 44);
  doc.filaTabla("Fecha y hora de recepción", "___________________________");

  doc.piePagina(`Causa RIT ${causa.rit} · Orden de investigar`);

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="orden-investigar-${causa.rit}.pdf"`,
    },
  });
}
