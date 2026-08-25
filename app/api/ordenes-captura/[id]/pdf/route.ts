import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { nombreLegal, formatearRut } from "@/lib/identidad";

export const dynamic = "force-dynamic";

const CAUSAL_LEGAL_TEXTO: Record<string, string> = {
  ART_127: "Art. 127 CPP — Orden judicial previa solicitud del fiscal, existiendo indicios de que el imputado ha tenido participación en el hecho investigado.",
  ART_128: "Art. 128 CPP — Detención por flagrancia, seguida de solicitud de orden para formalizar.",
  ART_33: "Art. 33 CPP — Citación judicial incumplida, que habilita despachar orden de detención.",
  ART_129: "Art. 129 CPP — Detención imputado por delito flagrante realizada por cualquier persona / Carabineros o PDI.",
  REBELDIA: "Rebeldía o incomparecencia injustificada a audiencia (art. 33, inciso final CPP).",
  OTRO: "Otro",
};

const POLICIA_TEXTO: Record<string, string> = {
  PDI: "Policía de Investigaciones de Chile (PDI)",
  CARABINEROS: "Carabineros de Chile",
  AMBAS: "Ambas policías, con carácter de orden amplia (búsqueda a nivel nacional / internacional)",
};

const fechaCorta = (d: Date) =>
  d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orden = await prisma.ordenCaptura.findUnique({
    where: { id: params.id },
    include: { causa: { include: { fiscal: true, juez: true } }, solicitadoPor: true },
  });
  if (!orden) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595.28, 841.89]); // A4 vertical
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  const navy = rgb(0.04, 0.12, 0.23);
  const blue = rgb(0.12, 0.32, 0.58);
  const gray = rgb(0.35, 0.38, 0.43);
  const lightGray = rgb(0.6, 0.63, 0.67);
  const paleLine = rgb(0.85, 0.87, 0.9);

  const MARGIN = 48;
  const { width, height } = page.getSize();
  let y = height - MARGIN;

  const saltoDePagina = () => {
    page = pdf.addPage([595.28, 841.89]);
    y = height - MARGIN;
  };

  const espacioDisponible = (necesario: number) => {
    if (y - necesario < MARGIN) saltoDePagina();
  };

  const wrapTexto = (texto: string, font: PDFFont, size: number, maxWidth: number): string[] => {
    const palabras = (texto || "—").split(/\s+/);
    const lineas: string[] = [];
    let actual = "";
    for (const palabra of palabras) {
      const prueba = actual ? `${actual} ${palabra}` : palabra;
      if (font.widthOfTextAtSize(prueba, size) > maxWidth && actual) {
        lineas.push(actual);
        actual = palabra;
      } else {
        actual = prueba;
      }
    }
    if (actual) lineas.push(actual);
    return lineas;
  };

  const parrafo = (texto: string, size = 10, font = regular, color = navy, indent = 0) => {
    const lineas = wrapTexto(texto, font, size, width - MARGIN * 2 - indent);
    for (const linea of lineas) {
      espacioDisponible(size + 6);
      page.drawText(linea, { x: MARGIN + indent, y, size, font, color });
      y -= size + 6;
    }
  };

  const tituloSeccion = (numeral: string, texto: string) => {
    y -= 6;
    espacioDisponible(28);
    page.drawText(`${numeral}. ${texto.toUpperCase()}`, { x: MARGIN, y, size: 11.5, font: bold, color: blue });
    y -= 8;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 0.75, color: paleLine });
    y -= 16;
  };

  // Tabla de dos columnas (campo / valor), como en la plantilla
  const filaTabla = (campo: string, valor: string) => {
    const size = 10;
    const colCampo = 165;
    const lineas = wrapTexto(valor || "—", regular, size, width - MARGIN * 2 - colCampo - 10);
    espacioDisponible(lineas.length * (size + 6) + 4);
    const yInicio = y;
    page.drawText(campo, { x: MARGIN, y, size, font: bold, color: gray });
    for (const linea of lineas) {
      page.drawText(linea, { x: MARGIN + colCampo, y, size, font: regular, color: navy });
      y -= size + 6;
    }
    page.drawLine({ start: { x: MARGIN, y: y - 2 }, end: { x: width - MARGIN, y: y - 2 }, thickness: 0.4, color: paleLine });
    y -= 8;
  };

  const casilla = (marcada: boolean, texto: string) => {
    const size = 9.5;
    const lineas = wrapTexto(texto, regular, size, width - MARGIN * 2 - 22);
    espacioDisponible(lineas.length * (size + 5) + 4);
    page.drawRectangle({ x: MARGIN, y: y - 8, width: 10, height: 10, borderColor: gray, borderWidth: 0.8 });
    if (marcada) {
      page.drawText("X", { x: MARGIN + 1.5, y: y - 7.5, size: 9, font: bold, color: blue });
    }
    let yy = y;
    for (const linea of lineas) {
      page.drawText(linea, { x: MARGIN + 18, y: yy, size, font: regular, color: navy });
      yy -= size + 5;
    }
    y = yy - 2;
  };

  // ---------- Encabezado ----------
  page.drawRectangle({ x: 0, y: height - 74, width, height: 74, color: navy });
  page.drawText("ORDEN DE DETENCIÓN Y CAPTURA", { x: MARGIN, y: height - 34, size: 17, font: bold, color: rgb(1, 1, 1) });
  page.drawText(
    "Conforme al Código Procesal Penal de Chile, arts. 9°, 122°, 125°, 127° y ss.",
    { x: MARGIN, y: height - 52, size: 8.5, font: italic, color: rgb(0.72, 0.85, 1) }
  );
  y = height - 74 - 28;

  // ---------- I. Datos del tribunal ----------
  tituloSeccion("I", "Datos del tribunal");
  filaTabla("Tribunal", "Juzgado de Garantía / Tribunal de Juicio Oral en lo Penal — Sistema RP");
  filaTabla("RIT", orden.causa.rit);
  filaTabla("RUC", orden.causa.ruc ?? "—");
  filaTabla("Fecha de la resolución", fechaCorta(orden.emitidaEn));
  filaTabla("Juez que la dicta", orden.causa.juez ? nombreLegal(orden.causa.juez) : nombreLegal(orden.solicitadoPor));

  // ---------- II. Identificación del imputado/a ----------
  tituloSeccion("II", "Identificación del imputado/a");
  filaTabla("Nombre completo", orden.nombrePersona);
  filaTabla("RUN / Pasaporte", orden.runOPasaporte ? formatearRut(orden.runOPasaporte) : "—");
  filaTabla("Nacionalidad", orden.nacionalidadPersona ?? "—");
  filaTabla("Fecha de nacimiento", orden.fechaNacimiento ?? "—");
  filaTabla("Domicilio conocido", orden.domicilioConocido ?? "—");
  filaTabla("Señas particulares", orden.senasParticulares ?? "No consta");

  // ---------- III. Antecedentes de la causa ----------
  tituloSeccion("III", "Antecedentes de la causa");
  filaTabla("Delito(s) imputado(s)", orden.causa.delito);
  filaTabla("Fiscal a cargo", nombreLegal(orden.causa.fiscal));
  y -= 4;
  page.drawText("RELACIÓN DE LOS HECHOS (SÍNTESIS)", { x: MARGIN, y, size: 9, font: bold, color: gray });
  y -= 14;
  parrafo(orden.motivo, 10);

  // ---------- IV. Fundamento legal de la orden ----------
  tituloSeccion("IV", "Fundamento legal de la orden");
  for (const [codigo, texto] of Object.entries(CAUSAL_LEGAL_TEXTO)) {
    casilla(orden.causalLegal === codigo, codigo === "OTRO" && orden.causalLegal === "OTRO" && orden.causalLegalOtro
      ? `Otro: ${orden.causalLegalOtro}`
      : texto);
  }
  y -= 6;
  page.drawText("FUNDAMENTACIÓN DE LA NECESIDAD DE CAUTELA", { x: MARGIN, y, size: 9, font: bold, color: gray });
  y -= 14;
  parrafo(orden.fundamentoCautela || "—", 10);

  // ---------- V. Resuelvo ----------
  tituloSeccion("V", "Resuelvo");
  parrafo(
    `Se ordena la detención y captura de ${orden.nombrePersona}, individualizado(a) en el punto II, debiendo ser puesto(a) a disposición de este tribunal dentro de las 24 horas siguientes a su detención (o del plazo ampliado conforme al art. 131 CPP).`,
    10,
    italic
  );
  y -= 6;
  page.drawText("SE INSTRUYE A", { x: MARGIN, y, size: 9, font: bold, color: gray });
  y -= 14;
  for (const [codigo, texto] of Object.entries(POLICIA_TEXTO)) {
    casilla(orden.policiaInstruida === codigo, texto);
  }
  y -= 4;
  filaTabla("Vigencia de la orden", orden.vigenciaOrden);
  filaTabla(
    "Registro",
    "Registro Nacional de Prófugos de la Fiscalía y/o sistema de órdenes pendientes de Carabineros (SIEC) / PDI."
  );
  filaTabla("Estado actual", orden.estado === "VIGENTE" ? "VIGENTE" : orden.estado === "EJECUTADA" ? "EJECUTADA" : "LEVANTADA");
  if (orden.levantadaEn) filaTabla("Fecha de levantamiento", fechaCorta(orden.levantadaEn));

  // ---------- VI. Firma y certificación ----------
  tituloSeccion("VI", "Firma y certificación");
  espacioDisponible(90);
  const colAncho = (width - MARGIN * 2 - 24) / 2;
  const yFirma = y - 46;
  page.drawLine({ start: { x: MARGIN, y: yFirma }, end: { x: MARGIN + colAncho, y: yFirma }, thickness: 0.8, color: gray });
  page.drawText("Juez/a", { x: MARGIN, y: yFirma - 12, size: 8.5, font: regular, color: lightGray });
  page.drawText(orden.causa.juez ? nombreLegal(orden.causa.juez) : nombreLegal(orden.solicitadoPor), { x: MARGIN, y: yFirma + 6, size: 9.5, font: italic, color: navy });

  const xCol2 = MARGIN + colAncho + 24;
  page.drawLine({ start: { x: xCol2, y: yFirma }, end: { x: xCol2 + colAncho, y: yFirma }, thickness: 0.8, color: gray });
  page.drawText("Ministro de fe / Secretario/a", { x: xCol2, y: yFirma - 12, size: 8.5, font: regular, color: lightGray });
  if (orden.secretarioNombre) {
    page.drawText(orden.secretarioNombre, { x: xCol2, y: yFirma + 6, size: 9.5, font: italic, color: navy });
  }
  y = yFirma - 34;
  filaTabla("Fecha de despacho", fechaCorta(orden.emitidaEn));

  // ---------- Pie de página en todas las hojas ----------
  const paginas = pdf.getPages();
  paginas.forEach((p, i) => {
    p.drawText(`ID de orden: ${orden.id}`, { x: MARGIN, y: 28, size: 7, font: regular, color: lightGray });
    p.drawText(`Página ${i + 1} de ${paginas.length}`, { x: width - MARGIN - 70, y: 28, size: 7, font: regular, color: lightGray });
  });

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="orden-deteccion-${orden.causa.rit}.pdf"`,
    },
  });
}
