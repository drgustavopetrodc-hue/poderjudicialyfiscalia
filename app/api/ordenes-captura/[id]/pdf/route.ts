import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orden = await prisma.ordenCaptura.findUnique({
    where: { id: params.id },
    include: { causa: true, solicitadoPor: true },
  });
  if (!orden) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.04, 0.12, 0.23);
  const blue = rgb(0.12, 0.32, 0.58);
  const gray = rgb(0.28, 0.33, 0.4);
  const pale = rgb(0.95, 0.98, 1);
  const { width, height } = page.getSize();

  page.drawRectangle({ x: 0, y: 0, width, height, color: pale });
  page.drawRectangle({ x: 0, y: height - 86, width, height: 86, color: navy });
  page.drawText("PODER JUDICIAL", { x: 50, y: height - 42, size: 18, font: bold, color: rgb(1, 1, 1) });
  page.drawText("DOCUMENTO OFICIAL DEL TRIBUNAL", { x: 50, y: height - 62, size: 8, font: regular, color: rgb(0.7, 0.84, 1) });

  let y = height - 140;
  const draw = (label: string, value: string, size = 12) => {
    page.drawText(label.toUpperCase(), { x: 50, y, size: 8, font: bold, color: blue });
    y -= 18;
    page.drawText(value, { x: 50, y, size, font: size > 16 ? bold : regular, color: navy, maxWidth: width - 100 });
    y -= size + 24;
  };

  page.drawText("ORDEN DE CAPTURA", { x: 50, y, size: 24, font: bold, color: navy });
  y -= 42;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1.5, color: blue });
  y -= 32;

  draw("Estado", orden.estado);
  draw("Persona requerida", orden.nombrePersona, 18);
  draw("Causa relacionada", `RIT ${orden.causa.rit} — ${orden.causa.caratulado}`);
  draw("Motivo", orden.motivo);
  draw("Emitida por", orden.solicitadoPor.name ?? "Autoridad judicial");
  draw("Fecha de emisión", orden.emitidaEn.toLocaleString("es-CL"));
  if (orden.levantadaEn) draw("Fecha de levantamiento", orden.levantadaEn.toLocaleString("es-CL"));

  page.drawLine({ start: { x: 50, y: 100 }, end: { x: 235, y: 100 }, thickness: 1, color: gray });
  page.drawLine({ start: { x: 360, y: 100 }, end: { x: width - 50, y: 100 }, thickness: 1, color: gray });
  page.drawText("Firma / sello del tribunal", { x: 85, y: 82, size: 9, font: regular, color: gray });
  page.drawText("Validación del documento", { x: 385, y: 82, size: 9, font: regular, color: gray });
  page.drawText(`ID de orden: ${orden.id}`, { x: 50, y: 42, size: 7, font: regular, color: gray });

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="orden-captura-${orden.causa.rit}.pdf"`,
    },
  });
}