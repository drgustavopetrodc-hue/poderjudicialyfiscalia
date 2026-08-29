import { prisma } from "@/lib/prisma";
import { PDFDocument } from "pdf-lib";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { nombreLegal, formatearRut } from "@/lib/identidad";
import { crearConstructorPdf, fechaCorta, POLICIA_TEXTO } from "@/lib/pdfLayout";

export const dynamic = "force-dynamic";

const TRIBUNAL_GENERICO = "Tribunal de Garantía y Juicio Oral en lo Penal — Sistema RP";

const CAUSAL_LEGAL_TEXTO: Record<string, string> = {
  ART_127: "Art. 127 CPP — Orden judicial previa solicitud del fiscal, existiendo indicios de que el imputado ha tenido participación en el hecho investigado.",
  ART_128: "Art. 128 CPP — Detención por flagrancia, seguida de solicitud de orden para formalizar.",
  ART_33: "Art. 33 CPP — Citación judicial incumplida, que habilita despachar orden de detención.",
  ART_129: "Art. 129 CPP — Detención imputado por delito flagrante realizada por cualquier persona / Carabineros o PDI.",
  REBELDIA: "Rebeldía o incomparecencia injustificada a audiencia (art. 33, inciso final CPP).",
  OTRO: "Otro",
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
  const nombreJuez = orden.causa.juez ? nombreLegal(orden.causa.juez) : nombreLegal(orden.solicitadoPor);

  doc.encabezado("ORDEN DE DETENCIÓN Y CAPTURA", "Conforme al Código Procesal Penal de Chile, arts. 9°, 122°, 125°, 127° y ss.");

  doc.tituloSeccion("I", "Datos del tribunal");
  doc.filaTabla("Tribunal", orden.causa.tribunal || TRIBUNAL_GENERICO);
  doc.filaTabla("RIT", orden.causa.rit);
  doc.filaTabla("RUC", orden.causa.ruc ?? "—");
  doc.filaTabla("Fecha de la resolución", fechaCorta(orden.emitidaEn));
  doc.filaTabla("Juez que la dicta", nombreJuez);

  doc.tituloSeccion("II", "Identificación del imputado/a");
  doc.filaTabla("Nombre completo", orden.nombrePersona);
  doc.filaTabla("RUN / Pasaporte", orden.runOPasaporte ? formatearRut(orden.runOPasaporte) : "—");
  doc.filaTabla("Nacionalidad", orden.nacionalidadPersona ?? "—");
  doc.filaTabla("Fecha de nacimiento", orden.fechaNacimiento ?? "—");
  doc.filaTabla("Domicilio conocido", orden.domicilioConocido ?? "—");
  doc.filaTabla("Señas particulares", orden.senasParticulares ?? "No consta");

  doc.tituloSeccion("III", "Antecedentes de la causa");
  doc.filaTabla("Delito(s) imputado(s)", orden.causa.delito);
  doc.filaTabla("Fiscal a cargo", nombreLegal(orden.causa.fiscal));
  doc.subtitulo("Relación de los hechos (síntesis)");
  doc.parrafo(orden.motivo, 10);

  doc.tituloSeccion("IV", "Fundamento legal de la orden");
  for (const [codigo, texto] of Object.entries(CAUSAL_LEGAL_TEXTO)) {
    doc.casilla(
      orden.causalLegal === codigo,
      codigo === "OTRO" && orden.causalLegal === "OTRO" && orden.causalLegalOtro ? `Otro: ${orden.causalLegalOtro}` : texto
    );
  }
  doc.subtitulo("Fundamentación de la necesidad de cautela");
  doc.parrafo(orden.fundamentoCautela || "—", 10);

  doc.tituloSeccion("V", "Resuelvo");
  doc.parrafo(
    `Se ordena la detención y captura de ${orden.nombrePersona}, individualizado(a) en el punto II, debiendo ser puesto(a) a disposición de este tribunal dentro de las 24 horas siguientes a su detención (o del plazo ampliado conforme al art. 131 CPP).`,
    10,
    doc.italic
  );
  doc.subtitulo("Se instruye a");
  for (const [codigo, texto] of Object.entries(POLICIA_TEXTO)) {
    doc.casilla(orden.policiaInstruida === codigo, texto);
  }
  doc.avanzar(-4);
  doc.filaTabla("Vigencia de la orden", orden.vigenciaOrden);
  doc.filaTabla("Registro", "Registro Nacional de Prófugos de la Fiscalía y/o sistema de órdenes pendientes de Carabineros (SIEC) / PDI.");
  doc.filaTabla("Estado actual", orden.estado);
  if (orden.levantadaEn) doc.filaTabla("Fecha de levantamiento", fechaCorta(orden.levantadaEn));

  doc.tituloSeccion("VI", "Firma y certificación");
  doc.espacioDisponible(90);
  const colAncho = (doc.width - 48 * 2 - 24) / 2;
  doc.lineaDeFirma(48, colAncho, nombreJuez, "Juez/a");
  doc.lineaDeFirma(48 + colAncho + 24, colAncho, orden.secretarioNombre, "Ministro de fe / Secretario/a");
  doc.fijarY(doc.obtenerY() - 44);
  doc.filaTabla("Fecha de despacho", fechaCorta(orden.emitidaEn));

  doc.piePagina(`ID de orden: ${orden.id}`);

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="orden-deteccion-${orden.causa.rit}.pdf"`,
    },
  });
}
