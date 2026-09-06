import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";

export const COLORES = {
  navy: rgb(0.04, 0.12, 0.23),
  blue: rgb(0.12, 0.32, 0.58),
  gray: rgb(0.35, 0.38, 0.43),
  lightGray: rgb(0.6, 0.63, 0.67),
  paleLine: rgb(0.85, 0.87, 0.9),
  blanco: rgb(1, 1, 1),
};

export const MARGIN = 48;
export const PAGE_SIZE: [number, number] = [595.28, 841.89]; // A4 vertical

/**
 * Constructor de documentos legales en PDF (órdenes, certificados, etc.).
 * Encapsula la paginación automática y el dibujo de tablas, casillas de
 * verificación y líneas de firma, para que todos los documentos del sistema
 * compartan el mismo diseño y no haya que corregir la alineación en 3 lugares
 * distintos cada vez.
 */
export async function crearConstructorPdf(pdf: PDFDocument) {
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  let page = pdf.addPage(PAGE_SIZE);
  const { width, height } = page.getSize();
  let y = height - MARGIN;

  function saltoDePagina() {
    page = pdf.addPage(PAGE_SIZE);
    y = height - MARGIN;
  }

  function espacioDisponible(necesario: number) {
    if (y - necesario < MARGIN) saltoDePagina();
  }

  function wrapTexto(texto: string, font: PDFFont, size: number, maxWidth: number): string[] {
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
  }

  function parrafo(texto: string, size = 10, font = regular, color = COLORES.navy, indent = 0) {
    const lineas = wrapTexto(texto, font, size, width - MARGIN * 2 - indent);
    for (const linea of lineas) {
      espacioDisponible(size + 6);
      page.drawText(linea, { x: MARGIN + indent, y, size, font, color });
      y -= size + 6;
    }
  }

  function tituloSeccion(numeral: string, texto: string) {
    y -= 6;
    espacioDisponible(28);
    page.drawText(`${numeral}. ${texto.toUpperCase()}`, { x: MARGIN, y, size: 11.5, font: bold, color: COLORES.blue });
    y -= 8;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 0.75, color: COLORES.paleLine });
    y -= 16;
  }

  function subtitulo(texto: string) {
    y -= 2;
    espacioDisponible(16);
    page.drawText(texto.toUpperCase(), { x: MARGIN, y, size: 9, font: bold, color: COLORES.gray });
    y -= 14;
  }

  /** Tabla de dos columnas (campo / valor). */
  function filaTabla(campo: string, valor: string) {
    const size = 10;
    const colCampo = 165;
    const lineas = wrapTexto(valor || "—", regular, size, width - MARGIN * 2 - colCampo - 10);
    espacioDisponible(lineas.length * (size + 6) + 4);
    page.drawText(campo, { x: MARGIN, y, size, font: bold, color: COLORES.gray });
    for (const linea of lineas) {
      page.drawText(linea, { x: MARGIN + colCampo, y, size, font: regular, color: COLORES.navy });
      y -= size + 6;
    }
    page.drawLine({ start: { x: MARGIN, y: y - 2 }, end: { x: width - MARGIN, y: y - 2 }, thickness: 0.4, color: COLORES.paleLine });
    y -= 8;
  }

  /**
   * Casilla de verificación (☐/☒). La caja se dibuja centrada respecto a la
   * altura real del texto (tomando en cuenta la altura de las mayúsculas del
   * tamaño de fuente usado), no respecto a la línea base — así la "X" queda
   * visualmente a la misma altura que el texto, no más abajo.
   */
  function casilla(marcada: boolean, texto: string) {
    const size = 9.5;
    const lineas = wrapTexto(texto, regular, size, width - MARGIN * 2 - 20);
    espacioDisponible(lineas.length * (size + 5) + 6);
    page.drawRectangle({ x: MARGIN, y: y - 2, width: 9, height: 9, borderColor: COLORES.gray, borderWidth: 0.8 });
    if (marcada) {
      page.drawText("X", { x: MARGIN + 1.7, y: y - 0.5, size: 8, font: bold, color: COLORES.blue });
    }
    let yy = y;
    for (const linea of lineas) {
      page.drawText(linea, { x: MARGIN + 17, y: yy, size, font: regular, color: COLORES.navy });
      yy -= size + 5;
    }
    y = yy - 3;
  }

  function encabezado(titulo: string, subt: string) {
    page.drawRectangle({ x: 0, y: height - 74, width, height: 74, color: COLORES.navy });
    page.drawText(titulo, { x: MARGIN, y: height - 34, size: 17, font: bold, color: COLORES.blanco });
    page.drawText(subt, { x: MARGIN, y: height - 52, size: 8.5, font: italic, color: rgb(0.72, 0.85, 1) });
    y = height - 74 - 28;
  }

  /** Bloque de firma: línea, luego el nombre debajo, luego la etiqueta del cargo. */
  function lineaDeFirma(xInicio: number, ancho: number, nombre: string | null, etiqueta: string) {
    const yFirma = y;
    page.drawLine({ start: { x: xInicio, y: yFirma }, end: { x: xInicio + ancho, y: yFirma }, thickness: 0.8, color: COLORES.gray });
    if (nombre) {
      page.drawText(nombre, { x: xInicio, y: yFirma - 14, size: 9.5, font: bold, color: COLORES.navy });
    }
    page.drawText(etiqueta, { x: xInicio, y: yFirma - (nombre ? 27 : 14), size: 8.5, font: regular, color: COLORES.lightGray });
  }

  /**
   * Bloque de firmas en grilla de N columnas (por defecto 2). Encapsula el
   * cálculo de X por columna y el avance de Y por fila para evitar el error
   * más común al armar esta sección a mano: reutilizar el mismo X para dos
   * columnas distintas, o decrementar Y por cada firma en vez de por fila
   * completa (lo que apila todas las firmas en una sola columna).
   *
   * Todas las firmas de una misma fila comparten el mismo Y — igual que
   * `lineaDeFirma` sola —, y solo se avanza Y una vez que la fila se completa.
   */
  function bloqueFirmas(firmas: { nombre: string | null; etiqueta: string }[], columnas = 2) {
    const gap = 24;
    const anchoColumna = (width - MARGIN * 2 - gap * (columnas - 1)) / columnas;
    const altoFila = 40; // línea + nombre (si existe) + etiqueta, con margen

    firmas.forEach((firma, i) => {
      const col = i % columnas;
      if (col === 0) espacioDisponible(altoFila);
      const xInicio = MARGIN + col * (anchoColumna + gap);
      lineaDeFirma(xInicio, anchoColumna, firma.nombre, firma.etiqueta);
      if (col === columnas - 1 || i === firmas.length - 1) y -= altoFila;
    });
  }

  function piePagina(idTexto: string) {
    const paginas = pdf.getPages();
    paginas.forEach((p, i) => {
      p.drawText(idTexto, { x: MARGIN, y: 28, size: 7, font: regular, color: COLORES.lightGray });
      p.drawText(`Página ${i + 1} de ${paginas.length}`, { x: width - MARGIN - 70, y: 28, size: 7, font: regular, color: COLORES.lightGray });
    });
  }

  return {
    regular,
    bold,
    italic,
    width,
    height,
    avanzar: (delta: number) => { y += delta; },
    obtenerY: () => y,
    fijarY: (valor: number) => { y = valor; },
    espacioDisponible,
    parrafo,
    tituloSeccion,
    subtitulo,
    filaTabla,
    casilla,
    encabezado,
    lineaDeFirma,
    bloqueFirmas,
    piePagina,
  };
}

export const fechaCorta = (d: Date) =>
  d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });

export const POLICIA_TEXTO: Record<string, string> = {
  PDI: "Policía de Investigaciones de Chile (PDI)",
  CARABINEROS: "Carabineros de Chile",
  AMBAS: "Ambas policías, con carácter de orden amplia (búsqueda a nivel nacional / internacional)",
};