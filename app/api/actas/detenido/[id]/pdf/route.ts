import { prisma } from "@/lib/prisma";
import { PDFDocument } from "pdf-lib";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { crearConstructorPdf, fechaCorta } from "@/lib/pdfLayout";
import { nombreLegal, formatearRut } from "@/lib/identidad";

export const dynamic = "force-dynamic";

const DERECHOS = [
  "El motivo de su detención y el delito que se le imputa.",
  "Derecho a guardar silencio o, si declara, a no hacerlo bajo juramento.",
  "Derecho a informar su detención a un familiar u otra persona que indique.",
  "Derecho a entrevistarse con un abogado desde el momento de la detención.",
  "Derecho a ser asistido por un abogado durante diligencias y declaración.",
  "Derecho a solicitar un defensor penal público si no cuenta con abogado particular.",
  "Derecho a no ser sometido a torturas ni tratos crueles, inhumanos o degradantes.",
  "Derecho a ser conducido sin demora ante el tribunal correspondiente.",
  "Derecho a conocer el estado de la investigación, salvo que sea secreta.",
  "Derecho a comunicarse con su consulado si es extranjero.",
];

const CAUSALES: Record<string, string> = {
  FLAGRANCIA: "Flagrancia (arts. 129-130 CPP)",
  ORDEN_JUDICIAL: "Orden judicial previa (art. 127 CPP)",
  INCUMPLIMIENTO_CITACION: "Incumplimiento de citación (art. 33 CPP)",
  OTRA: "Otra causal",
};

const ejercicio = (valor: boolean) => (valor ? "Sí" : "No");

type SessionUser = { id?: string; rol?: string };

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  if (!user?.id || !user.rol || !["FUNCIONARIO", "ADMIN", "FISCAL"].includes(user.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const acta = await prisma.actaDerechosDetenido.findUnique({
    where: { id: params.id },
    include: { funcionario: true, causa: { select: { fiscalId: true } } },
  });
  if (!acta) return NextResponse.json({ error: "Acta no encontrada" }, { status: 404 });
  const puedeDescargar = user.rol === "ADMIN"
    || (user.rol === "FUNCIONARIO" && acta.funcionarioId === user.id)
    || (user.rol === "FISCAL" && acta.causa?.fiscalId === user.id);
  if (!puedeDescargar) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const pdf = await PDFDocument.create();
  const doc = await crearConstructorPdf(pdf);
  const derechos = new Set(acta.derechosInformados);

  doc.encabezado(
    "ACTA DE INFORMACIÓN DE DERECHOS AL DETENIDO",
    "Conforme al Código Procesal Penal de Chile, arts. 135, 136, 93 y 94"
  );

  doc.tituloSeccion("I", "Datos de la diligencia");
  doc.filaTabla("Unidad policial", acta.unidadPolicial);
  doc.filaTabla("Fecha", acta.fechaDiligencia);
  doc.filaTabla("Hora de la detención", acta.horaDetencion);
  doc.filaTabla("Hora de lectura de derechos", acta.horaLectura);
  doc.filaTabla("Lugar de la detención", acta.lugarDetencion);
  doc.filaTabla("Funcionario que informa", `${acta.funcionarioNombre} · ${acta.funcionarioPlaca}`);
  doc.filaTabla("RUC", acta.ruc || "No asignado");

  doc.tituloSeccion("II", "Identificación del detenido/a");
  doc.filaTabla("Nombre completo", acta.detenidoNombre);
  doc.filaTabla("RUN / Pasaporte", formatearRut(acta.detenidoRunPasaporte));
  doc.filaTabla("Nacionalidad", acta.detenidoNacionalidad);
  doc.filaTabla("Fecha nacimiento / Edad", acta.detenidoNacimientoEdad);
  doc.filaTabla("Domicilio", acta.detenidoDomicilio);
  doc.filaTabla("¿Es menor de edad?", acta.esMenor ? "Sí — aplicar Ley 20.084 (RPA)" : "No");
  doc.filaTabla("¿Requiere intérprete o apoyo?", acta.requiereInterprete ? `Sí${acta.interpreteDetalle ? `: ${acta.interpreteDetalle}` : ""}` : "No");

  doc.tituloSeccion("III", "Motivo de la detención");
  doc.filaTabla("Delito(s) imputado(s)", acta.delitosImputados);
  doc.filaTabla("Causal", CAUSALES[acta.causalDetencion] ?? acta.causalDetencion);
  doc.filaTabla("N° de orden / detalle", acta.ordenNumero || "—");

  doc.tituloSeccion("IV", "Derechos informados al detenido");
  doc.parrafo("Se deja constancia de que los derechos fueron informados de manera específica y clara, verbalmente y por escrito:", 9.5);
  DERECHOS.forEach((derecho, index) => doc.casilla(derechos.has(String(index)), derecho));

  doc.tituloSeccion("V", "Ejercicio de derechos por parte del detenido");
  doc.filaTabla("Guardar silencio", ejercicio(acta.silencioEjercido));
  doc.filaTabla("Observaciones", acta.silencioObservaciones || "—");
  doc.filaTabla("Aviso a familiar / tercero", ejercicio(acta.avisoFamiliar));
  doc.filaTabla("Detalle del aviso", acta.avisoDetalle || "—");
  doc.filaTabla("Entrevista con abogado", ejercicio(acta.entrevistaAbogado));
  doc.filaTabla("Abogado y hora", acta.abogadoDetalle || "—");
  doc.filaTabla("Defensor penal público", ejercicio(acta.defensorPublico));
  doc.filaTabla("Comunicación consular", acta.comunicacionConsular === "NA" ? "N/A" : acta.comunicacionConsular === "SI" ? "Sí" : "No");

  doc.tituloSeccion("VI", "Examen de lesiones");
  doc.casilla(Boolean(acta.lesionesDetalle), `Se realizó constatación de lesiones: ${acta.lesionesDetalle || "—"}`);
  doc.casilla(acta.sinLesionesAparentes, "No presenta lesiones aparentes al momento del control.");

  doc.tituloSeccion("VII", "Observaciones adicionales");
  doc.parrafo(acta.observaciones || "Sin observaciones adicionales.", 10);

  
  
  
  
  
  
  doc.tituloSeccion("VIII", "Firmas");
  doc.bloqueFirmas([
    { nombre: acta.funcionarioNombre, etiqueta: "Funcionario que informa los derechos" },
    { nombre: acta.detenidoFirma || null, etiqueta: "Detenido/a o constancia de negativa a firmar" },
    { nombre: acta.testigoFirma || null, etiqueta: "Testigo actuante (si aplica)" },
  ]);
  doc.filaTabla("Hora de término del acta", acta.horaTermino);

  doc.piePagina(`ID de acta: ${acta.id} · Funcionario: ${nombreLegal(acta.funcionario)}`);

  const bytes = await pdf.save();
  const filename = `acta-derechos-detenido-${acta.detenidoNombre.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.pdf`;
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}