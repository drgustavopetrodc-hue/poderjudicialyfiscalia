import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { crearConstructorPdf, fechaCorta } from "@/lib/pdfLayout";
import { nombreLegal } from "@/lib/identidad";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const usuario = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, nombreIC: true, name: true, rut: true } });
  if (!usuario) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  const causas = await prisma.causa.findMany({ where: { OR: [{ fiscalId: user.id }, { juezId: user.id }, { partes: { some: { userId: user.id } } }] }, select: { rit: true, caratulado: true, delito: true, estado: true }, orderBy: { creadaEn: "desc" } });

  const pdf = await PDFDocument.create();
  const doc = await crearConstructorPdf(pdf);
  doc.encabezadoOficio("Poder Judicial", "TRÁMITE FÁCIL", "CERTIFICADO DE ANTECEDENTES");
  doc.fichaOficio([
    { etiqueta: "Persona consultante", valor: nombreLegal(usuario) },
    { etiqueta: "RUT", valor: usuario.rut || "No informado" },
    { etiqueta: "Fecha de emisión", valor: fechaCorta(new Date()) },
    { etiqueta: "Resultado", valor: causas.length ? `Se registran ${causas.length} causa(s) asociada(s)` : "No se registran causas asociadas en el sistema" },
  ]);
  doc.tituloSeccion("I", "Resultado de la consulta");
  doc.parrafo(causas.length ? "La consulta encontró los siguientes registros judiciales asociados al usuario consultante:" : "Revisados los registros disponibles del sistema, no se encontraron causas asociadas al usuario consultante.");
  causas.forEach((causa, index) => {
    doc.filaTabla(`${index + 1}. RIT ${causa.rit}`, `${causa.caratulado} · ${causa.delito} · Estado: ${causa.estado}`);
  });
  doc.tituloSeccion("II", "Alcance del certificado");
  doc.parrafo("Este documento refleja exclusivamente la información disponible en el sistema al momento de su emisión y no reemplaza las certificaciones oficiales emitidas por la autoridad competente.", 8.5, doc.italic);
  doc.piePagina("Certificado de antecedentes · Trámite Fácil");
  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=certificado-antecedentes.pdf" } });
}
