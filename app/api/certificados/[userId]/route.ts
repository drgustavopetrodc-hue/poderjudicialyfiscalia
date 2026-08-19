import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { format } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { userId: string } }) {
  const certificacion = await prisma.certificacionAbogado.findUnique({
    where: { userId: params.userId },
    include: { user: true },
  });

  if (!certificacion || certificacion.estado !== "APROBADA") {
    return NextResponse.json({ error: "Certificación no encontrada o no aprobada" }, { status: 404 });
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 apaisado
  const { width, height } = page.getSize();

  const serif = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const serifRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const mono = await pdfDoc.embedFont(StandardFonts.Courier);

  const marino = rgb(0.06, 0.09, 0.15);
  const dorado = rgb(0.72, 0.58, 0.25);
  const grafito = rgb(0.16, 0.16, 0.16);

  // Fondo y marco ornamental
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.96, 0.95, 0.92) });
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: dorado,
    borderWidth: 2,
  });
  page.drawRectangle({
    x: 34,
    y: 34,
    width: width - 68,
    height: height - 68,
    borderColor: marino,
    borderWidth: 0.75,
  });

  const centerText = (text: string, y: number, font = serif, size = 14, color = grafito) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - w) / 2, y, size, font, color });
  };

  centerText("REPÚBLICA DE CHILE", height - 90, mono, 11, dorado);
  centerText("PODER JUDICIAL", height - 115, serif, 22, marino);
  centerText("Certificado de Habilitación para el Ejercicio de la Defensa Técnica", height - 145, serifRegular, 13);

  centerText("Se certifica que", height - 210, serifRegular, 13);
  centerText(certificacion.user.name ?? "Nombre no registrado", height - 250, serif, 30, marino);

  centerText(
    `se encuentra habilitado(a) para ejercer la defensa técnica ante los tribunales,`,
    height - 300,
    serifRegular,
    13
  );
  centerText(
    `bajo el número de matrícula ${certificacion.numeroMatricula}.`,
    height - 322,
    serifRegular,
    13
  );

  const fecha = certificacion.revisadoEn ?? certificacion.solicitadoEn;
  centerText(`Certificado emitido el ${format(fecha, "dd 'de' MMMM 'de' yyyy")}.`, height - 380, mono, 11, dorado);

  // Línea de firma
  page.drawLine({
    start: { x: width / 2 - 100, y: 130 },
    end: { x: width / 2 + 100, y: 130 },
    thickness: 1,
    color: grafito,
  });
  centerText("Corte Suprema", 112, serifRegular, 11);

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificado-${certificacion.numeroMatricula}.pdf"`,
    },
  });
}
