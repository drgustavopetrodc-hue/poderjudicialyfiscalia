import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { crearConstructorPdf, fechaCorta } from "@/lib/pdfLayout";
import { nombreLegal } from "@/lib/identidad";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; rol?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const demanda = await prisma.demanda.findUnique({ where: { id: params.id }, include: { presentadaPor: true } });
  if (!demanda) return NextResponse.json({ error: "Demanda no encontrada" }, { status: 404 });
  if (user.rol !== "ADMIN" && demanda.presentadaPorId !== user.id) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const pdf = await PDFDocument.create();
  const doc = await crearConstructorPdf(pdf);
  doc.encabezadoOficio("Poder Judicial", "MESA DE PARTES", "CONSTANCIA DE INGRESO DE DEMANDA");
  doc.fichaOficio([
    { etiqueta: "Fecha de ingreso", valor: fechaCorta(demanda.creadoEn) },
    { etiqueta: "Tribunal", valor: demanda.tribunal },
    { etiqueta: "Materia", valor: demanda.materia },
    { etiqueta: "Presentada por", valor: nombreLegal(demanda.presentadaPor) },
    { etiqueta: "Estado", valor: demanda.estado },
  ]);
  doc.tituloSeccion("I", "Partes");
  doc.filaTabla("Demandante", `${demanda.demandante}${demanda.demandanteRut ? ` · RUT ${demanda.demandanteRut}` : ""}`);
  doc.filaTabla("Demandado", `${demanda.demandado}${demanda.demandadoRut ? ` · RUT ${demanda.demandadoRut}` : ""}`);
  doc.tituloSeccion("II", "Hechos");
  doc.parrafo(demanda.hechos);
  doc.tituloSeccion("III", "Fundamentos de derecho");
  doc.parrafo(demanda.fundamentosDerecho);
  doc.tituloSeccion("IV", "Peticiones");
  doc.parrafo(demanda.peticiones);
  doc.tituloSeccion("V", "Documentos ofrecidos");
  doc.parrafo(demanda.documentosDescripcion || "No se describieron documentos adicionales.");
  if (demanda.archivoNombre) doc.parrafo(`Se adjuntó el archivo: ${demanda.archivoNombre}.`);
  doc.piePagina(`Constancia de demanda · ID ${demanda.id}`);
  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="constancia-demanda-${demanda.id}.pdf"` } });
}
