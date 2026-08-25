import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { nombreLegal } from "@/lib/identidad";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const causa = await prisma.causa.findUnique({
    where: { id: params.id },
    include: { fiscal: true, juez: true, escritos: { include: { autor: true }, orderBy: { presentadoEn: "asc" } }, ordenesCaptura: true, adjuntosFiscales: true, testimonios: true, sentencia: true },
  });
  if (!causa) return NextResponse.json({ error: "Causa no encontrada" }, { status: 404 });

  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.04, 0.12, 0.23);
  const blue = rgb(0.12, 0.32, 0.58);
  const gray = rgb(0.35, 0.38, 0.43);
  let page = pdf.addPage([595, 842]);
  let y = 790;
  const line = (text: string, size = 10, font = regular, color = gray) => {
    const chunks = text.match(/.{1,90}(\s|$)/g) ?? [text];
    for (const chunk of chunks) {
      if (y < 55) { page = pdf.addPage([595, 842]); y = 790; }
      page.drawText(chunk.trim(), { x: 48, y, size, font, color });
      y -= size + 6;
    }
  };
  page.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(0.97, 0.985, 1) });
  page.drawRectangle({ x: 0, y: 790, width: 595, height: 52, color: navy });
  page.drawText("PODER JUDICIAL", { x: 48, y: 811, size: 16, font: bold, color: rgb(1, 1, 1) });
  page.drawText("EXPEDIENTE JUDICIAL", { x: 420, y: 813, size: 8, font: regular, color: rgb(0.72, 0.84, 1) });
  y = 755;
  line(`RIT ${causa.rit} · ${causa.estado.replace(/_/g, " ")}`, 11, bold, blue);
  line(causa.caratulado, 18, bold, navy);
  y -= 12;
  line(`Delito: ${causa.delito}`, 10, bold, navy);
  line(`Fiscal: ${nombreLegal(causa.fiscal)} · Juez: ${causa.juez ? nombreLegal(causa.juez) : "Sin asignar"}`);
  y -= 8;
  line("DESCRIPCIÓN DE LOS HECHOS", 10, bold, blue);
  line(causa.descripcion);
  y -= 8;
  line(`ESCRITOS PRESENTADOS (${causa.escritos.length})`, 10, bold, blue);
  for (const escrito of causa.escritos) line(`${escrito.tipo} — ${escrito.titulo} — ${nombreLegal(escrito.autor)}`);
  y -= 8;
  line(`ÓRDENES DE CAPTURA (${causa.ordenesCaptura.length})`, 10, bold, blue);
  for (const orden of causa.ordenesCaptura) line(`${orden.nombrePersona} — ${orden.estado} — ${orden.motivo}`);
  line(`ANTECEDENTES ADJUNTOS (${causa.adjuntosFiscales.length})`, 10, bold, blue);
  for (const adjunto of causa.adjuntosFiscales) line(`${adjunto.tipo} — ${adjunto.nombre}`);
  line(`TESTIMONIOS (${causa.testimonios.length})`, 10, bold, blue);
  for (const testimonio of causa.testimonios) line(`${testimonio.declarante}: ${testimonio.contenido}`);
  if (causa.sentencia) {
    y -= 8;
    line("SENTENCIA", 10, bold, blue);
    line(`${causa.sentencia.resultado}: ${causa.sentencia.fundamento}`);
    if (causa.sentencia.pena) line(`Pena: ${causa.sentencia.pena}`);
  }
  y -= 18;
  line(`Documento generado el ${new Date().toLocaleDateString("es-CL")}`, 8, regular, gray);
  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="expediente-${causa.rit}.pdf"` },
  });
}