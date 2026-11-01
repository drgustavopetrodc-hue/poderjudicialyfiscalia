import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";

export const COLORES = {
  navy: rgb(0.04, 0.12, 0.23),
  negro: rgb(0, 0, 0),
  blue: rgb(0.12, 0.32, 0.58),
  gray: rgb(0.35, 0.38, 0.43),
  lightGray: rgb(0.6, 0.63, 0.67),
  paleLine: rgb(0.85, 0.87, 0.9),
  blanco: rgb(1, 1, 1),
};

export const MARGIN = 48;
export const PAGE_SIZE: [number, number] = [595.28, 841.89]; 


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
    page.drawText(`${numeral}. ${texto.toUpperCase()}`, { x: MARGIN, y, size: 11.5, font: bold, color: COLORES.negro });
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
    
    
    
    
    
    page.drawLine({ start: { x: MARGIN, y: y + 4 }, end: { x: width - MARGIN, y: y + 4 }, thickness: 0.4, color: COLORES.paleLine });
    y -= 8;
  }

  
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

  
  function encabezadoOficio(marca: string, identificador: string, titulo: string) {
    page.drawText(marca.toUpperCase(), { x: MARGIN, y: height - 42, size: 12, font: bold, color: COLORES.navy });
    page.drawText("REPÚBLICA DE CHILE", { x: MARGIN, y: height - 55, size: 6.5, font: regular, color: COLORES.gray });
    const etiquetaAncho = Math.max(95, regular.widthOfTextAtSize(identificador, 8.5) + 18);
    page.drawRectangle({ x: width - MARGIN - etiquetaAncho, y: height - 54, width: etiquetaAncho, height: 22, borderColor: COLORES.gray, borderWidth: 1 });
    page.drawText(identificador, { x: width - MARGIN - etiquetaAncho + 9, y: height - 46, size: 8.5, font: bold, color: COLORES.navy });
    page.drawLine({ start: { x: MARGIN, y: height - 78 }, end: { x: width - MARGIN, y: height - 78 }, thickness: 1.2, color: COLORES.navy });
    page.drawRectangle({ x: MARGIN, y: height - 123, width: width - MARGIN * 2, height: 34, color: rgb(0, 0, 0) });
    const tituloAncho = bold.widthOfTextAtSize(titulo, 13);
    page.drawText(titulo, { x: (width - tituloAncho) / 2, y: height - 111, size: 13, font: bold, color: COLORES.blanco });
    y = height - 139;
  }

  
  function fichaOficio(campos: { etiqueta: string; valor: string }[]) {
    const etiquetaAncho = 122;
    const size = 9;
    const alto = campos.reduce((total, campo) => total + Math.max(15, wrapTexto(campo.valor || "—", regular, size, width - MARGIN * 2 - etiquetaAncho - 24).length * 13), 0) + 18;
    espacioDisponible(alto + 8);
    page.drawRectangle({ x: MARGIN, y: y - alto, width: width - MARGIN * 2, height: alto, color: rgb(0.96, 0.97, 0.98) });
    page.drawRectangle({ x: MARGIN, y: y - alto, width: 3, height: alto, color: rgb(0, 0, 0) });
    let yy = y - 15;
    for (const campo of campos) {
      page.drawText(campo.etiqueta.toUpperCase(), { x: MARGIN + 14, y: yy, size, font: bold, color: COLORES.navy });
      const lineas = wrapTexto(campo.valor || "—", regular, size, width - MARGIN * 2 - etiquetaAncho - 24);
      lineas.forEach((linea, indice) => page.drawText(linea, { x: MARGIN + etiquetaAncho + 14, y: yy - indice * 13, size, font: regular, color: COLORES.navy }));
      yy -= Math.max(15, lineas.length * 13);
    }
    y -= alto + 18;
  }

  
  function lineaDeFirma(xInicio: number, ancho: number, nombre: string | null, etiqueta: string) {
    const yFirma = y;
    page.drawLine({ start: { x: xInicio, y: yFirma }, end: { x: xInicio + ancho, y: yFirma }, thickness: 0.8, color: COLORES.gray });
    if (nombre) {
      page.drawText(nombre, { x: xInicio, y: yFirma - 14, size: 9.5, font: bold, color: COLORES.navy });
    }
    page.drawText(etiqueta, { x: xInicio, y: yFirma - (nombre ? 27 : 14), size: 8.5, font: regular, color: COLORES.lightGray });
  }

  
  function bloqueFirmas(firmas: { nombre: string | null; etiqueta: string }[], columnas = 2) {
    const gap = 24;
    const anchoColumna = (width - MARGIN * 2 - gap * (columnas - 1)) / columnas;
    const altoFila = 40; 

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
    encabezadoOficio,
    fichaOficio,
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
