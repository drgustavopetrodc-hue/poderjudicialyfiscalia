import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { NextRequest, NextResponse } from "next/server";
import { nombreLegal, formatearRut, identidadCompleta } from "@/lib/identidad";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { userId: string } }) {
  const certificacion = await prisma.certificacionAbogado.findUnique({
    where: { userId: params.userId },
    include: { user: true },
  });

  if (!certificacion || certificacion.estado !== "APROBADA") {
    return NextResponse.json({ error: "Certificación no encontrada o no aprobada" }, { status: 404 });
  }

  if (!identidadCompleta(certificacion.user)) {
    return NextResponse.json(
      { error: "Este abogado aún no completa su nombre y RUT en /perfil, no se puede emitir el certificado." },
      { status: 400 }
    );
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 1008]);
  const { width, height } = page.getSize();

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const negro = rgb(0.08, 0.08, 0.08);
  const marcaAgua = rgb(0.68, 0.68, 0.68);

  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });
  for (let y = -80; y < height + 180; y += 92) {
    for (let x = -260; x < width + 260; x += 190) {
      page.drawText("PODER JUDICIAL", {
        x,
        y,
        size: 22,
        font: bold,
        color: marcaAgua,
        rotate: degrees(45),
        opacity: 0.12,
      });
    }
  }

  const centerText = (text: string, y: number, font = regular, size = 12, color = negro) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - w) / 2, y, size, font, color });
  };

  const fechaExpedicion = certificacion.revisadoEn ?? certificacion.solicitadoEn;
  const fechaEmision = new Date();
  const fechaExpedicionTexto = format(fechaExpedicion, "d 'de' MMMM 'de' yyyy", { locale: es });
  const fechaEmisionTexto = format(fechaEmision, "d 'de' MMMM 'de' yyyy", { locale: es });
  const nombre = nombreLegal(certificacion.user).toUpperCase();

  centerText("CERTIFICADO DE TÍTULO DE ABOGADO", 866, bold, 14);
  page.drawText("Certifico que en los registros de esta Secretaría consta que en la", { x: 123, y: 760, size: 12, font: regular, color: negro });
  page.drawText(`audiencia del día ${fechaExpedicionTexto}, la Corte Suprema`, { x: 123, y: 744, size: 12, font: regular, color: negro });
  page.drawText("en Pleno invistió con el Título de Abogado a:", { x: 123, y: 728, size: 12, font: regular, color: negro });
  page.drawText(`Don ${nombre}`, { x: 123, y: 694, size: 12, font: regular, color: negro });
  page.drawText(`R.U.T. ${formatearRut(certificacion.user.rut!)}`, { x: 123, y: 678, size: 12, font: regular, color: negro });
  page.drawText(`Expedido en Santiago de Chile, ${fechaExpedicionTexto}.`, { x: 123, y: 644, size: 12, font: regular, color: negro });

  page.drawLine({ start: { x: 205, y: 470 }, end: { x: 407, y: 470 }, thickness: 0.8, color: negro });
  centerText("Gabriel Boric Font", 450, regular, 12);
  centerText("PRESIDENTE", 434, regular, 12);
  centerText("CORTE SUPREMA", 418, regular, 12);

  page.drawText(`Matrícula: ${certificacion.numeroMatricula}`, { x: 73, y: 222.9, size: 7, font: regular, color: negro });
  centerText(`Emitido el ${fechaEmisionTexto}. Validez un año desde la fecha de emisión.`, 187.9, regular, 8, negro);
  centerText("Verifique la validez de este documento en el portal del Poder Judicial.", 175.9, regular, 8, negro);

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificado-${certificacion.numeroMatricula}.pdf"`,
    },
  });
}
