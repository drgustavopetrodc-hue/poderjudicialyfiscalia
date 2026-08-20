import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";

const FORUM_CHANNEL_ID = process.env.DISCORD_FORUM_CHANNEL_ID ?? "1535335522912837672";
const DISCORD_API = "https://discord.com/api/v10";

type CausaConDatos = Awaited<ReturnType<typeof cargarCausa>>;

async function cargarCausa(causaId: string) {
  return prisma.causa.findUnique({
    where: { id: causaId },
    include: {
      fiscal: true,
      juez: true,
      escritos: { include: { autor: true }, orderBy: { presentadoEn: "asc" } },
      audiencias: { orderBy: { fechaHora: "asc" } },
      ordenesCaptura: true,
      sentencia: true,
    },
  });
}

function textoCorto(value: string, length = 900) {
  return value.length > length ? `${value.slice(0, length - 3)}...` : value;
}

async function crearPdf(causa: NonNullable<CausaConDatos>) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.04, 0.12, 0.23);
  const blue = rgb(0.12, 0.32, 0.58);
  const gray = rgb(0.35, 0.38, 0.43);
  let page = pdf.addPage([595, 842]);
  let y = 790;
  const add = (value: string, size = 10, font = regular, color = gray) => {
    const chunks = value.match(/.{1,88}(\s|$)/g) ?? [value];
    for (const chunk of chunks) {
      if (y < 55) { page = pdf.addPage([595, 842]); y = 790; }
      page.drawText(chunk.trim(), { x: 48, y, size, font, color });
      y -= size + 6;
    }
  };
  page.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(0.97, 0.985, 1) });
  page.drawRectangle({ x: 0, y: 790, width: 595, height: 52, color: navy });
  page.drawText("PODER JUDICIAL", { x: 48, y: 811, size: 16, font: bold, color: rgb(1, 1, 1) });
  page.drawText("EXPEDIENTE ACTUALIZADO", { x: 420, y: 813, size: 8, font: regular, color: rgb(0.72, 0.84, 1) });
  y = 755;
  add(`RIT ${causa.rit} · ${causa.estado.replace(/_/g, " ")}`, 11, bold, blue);
  add(causa.caratulado, 18, bold, navy);
  y -= 8;
  add(`Delito: ${causa.delito}`, 10, bold, navy);
  add(`Fiscal: ${causa.fiscal.name ?? "Sin nombre"} · Juez: ${causa.juez?.name ?? "Sin asignar"}`);
  y -= 8;
  add("DESCRIPCIÓN", 10, bold, blue);
  add(causa.descripcion);
  y -= 8;
  add(`AUDIENCIAS (${causa.audiencias.length})`, 10, bold, blue);
  for (const audiencia of causa.audiencias) add(`${audiencia.tipo} — ${audiencia.fechaHora.toLocaleString("es-CL")} — ${audiencia.estado}`);
  y -= 8;
  add(`ÓRDENES DE CAPTURA (${causa.ordenesCaptura.length})`, 10, bold, blue);
  for (const orden of causa.ordenesCaptura) add(`${orden.nombrePersona} — ${orden.estado} — ${orden.motivo}`);
  y -= 8;
  add(`ESCRITOS (${causa.escritos.length})`, 10, bold, blue);
  for (const escrito of causa.escritos) add(`${escrito.tipo} — ${escrito.titulo} — ${escrito.autor.name ?? "Sin autor"}`);
  if (causa.sentencia) {
    y -= 8;
    add("SENTENCIA", 10, bold, blue);
    add(`${causa.sentencia.resultado}: ${causa.sentencia.fundamento}`);
  }
  y -= 18;
  add(`Generado el ${new Date().toLocaleString("es-CL")}`, 8);
  return pdf.save();
}

async function discordRequest(path: string, init: RequestInit) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("DISCORD_BOT_TOKEN no configurado");
  return fetch(`${DISCORD_API}${path}`, {
    ...init,
    headers: { Authorization: `Bot ${token}`, ...(init.headers ?? {}) },
    cache: "no-store",
  });
}

/**
 * Crea el post del foro si aún no existe y publica el PDF actualizado.
 * Los errores se absorben para no impedir que el sistema judicial guarde la causa.
 */
export async function publicarCausaEnDiscord(causaId: string, evento: string) {
  try {
    const causa = await cargarCausa(causaId);
    if (!causa) return;

    let threadId = causa.discordForumThreadId;
    if (!threadId) {
      const response = await discordRequest(`/channels/${FORUM_CHANNEL_ID}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `RIT ${causa.rit} — ${textoCorto(causa.caratulado, 80)}`,
          auto_archive_duration: 10080,
          message: {
            content: `📁 **Nueva causa registrada**\n**RIT:** ${causa.rit}\n**Caratulado:** ${causa.caratulado}\n**Estado:** ${causa.estado.replace(/_/g, " ")}`,
          },
        }),
      });
      if (!response.ok) throw new Error(`Discord no pudo crear el post (${response.status})`);
      const created = (await response.json()) as { id: string };
      threadId = created.id;
      await prisma.causa.update({ where: { id: causaId }, data: { discordForumThreadId: threadId } });
    }

    const pdf = await crearPdf(causa);
    const form = new FormData();
    form.append("payload_json", JSON.stringify({
      content: `🔄 **${evento}** · Estado: \`${causa.estado.replace(/_/g, " ")}\``,
    }));
    form.append("files[0]", new Blob([pdf], { type: "application/pdf" }), `expediente-${causa.rit}.pdf`);
    const upload = await discordRequest(`/channels/${threadId}/messages`, { method: "POST", body: form });
    if (!upload.ok) throw new Error(`Discord no pudo adjuntar el expediente (${upload.status})`);
  } catch (error) {
    console.error("No se pudo sincronizar la causa con el foro de Discord:", error);
  }
}