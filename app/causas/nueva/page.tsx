import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import { redirect } from "next/navigation";
import { publicarCausaEnDiscord } from "@/lib/discordForum";
import { codigoPenalPorTitulo, articuloPorNumero } from "@/lib/codigoPenal";
import { DILIGENCIAS_ORDEN_INVESTIGAR } from "@/lib/diligencias";
import { AlertCircle } from "lucide-react";

const ROLES_CON_ACCESO = ["FISCAL", "ADMIN"];

async function crearCausa(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const fiscalId = (session?.user as any)?.id as string;
  const rol = (session?.user as any)?.rol;
  if (!fiscalId || !ROLES_CON_ACCESO.includes(rol)) return;

  const rit = String(formData.get("rit"));
  const ruc = String(formData.get("ruc") ?? "").trim();
  const tribunal = String(formData.get("tribunal") ?? "").trim();
  const caratulado = String(formData.get("caratulado"));
  const descripcion = String(formData.get("descripcion"));

  const numerosSeleccionados = formData
    .getAll("articulos")
    .map((v) => Number(v))
    .filter((n) => !Number.isNaN(n));

  const articulosSeleccionados = numerosSeleccionados
    .map((n) => articuloPorNumero(n))
    .filter((a): a is NonNullable<typeof a> => Boolean(a))
    .sort((a, b) => a.numero - b.numero);

  if (articulosSeleccionados.length === 0) {
    redirect("/causas/nueva?error=sin-articulo");
  }

  const delito = articulosSeleccionados.map((a) => `Art. ${a.numero} — ${a.delito}`).join("; ");

  // ---------- Datos del imputado (permite "sin individualizar") ----------
  const imputadoIndividualizado = formData.get("imputadoIndividualizado") === "on";
  const imputadoNombre = String(formData.get("imputadoNombre") ?? "").trim();
  const imputadoRut = String(formData.get("imputadoRut") ?? "").trim();

  // ---------- Datos para la Orden de Investigar ----------
  const fiscalia = String(formData.get("fiscalia") ?? "").trim();
  const unidadPolicial = String(formData.get("unidadPolicial") ?? "AMBAS");
  const victimaNombre = String(formData.get("victimaNombre") ?? "").trim();
  const diligenciasOtras = String(formData.get("diligenciasOtras") ?? "").trim();
  const plazoInforme = String(formData.get("plazoInforme") ?? "").trim();
  const urgencia = String(formData.get("urgencia") ?? "ORDINARIA");
  const formaRemision = String(formData.get("formaRemision") ?? "").trim();
  const instrucciones = String(formData.get("instrucciones") ?? "").trim();

  const diligencias = DILIGENCIAS_ORDEN_INVESTIGAR
    .map((d) => d.codigo)
    .filter((codigo) => formData.get(`diligencia_${codigo}`) === "on");

  let causa;
  try {
    causa = await prisma.causa.create({
      data: {
        rit,
        ruc: ruc || null,
        tribunal: tribunal || null,
        caratulado,
        delito,
        descripcion,
        fiscalId,
        ordenInvestigar: {
          create: {
            fiscalia: fiscalia || null,
            unidadPolicial,
            imputadoIndividualizado,
            imputadoNombre: imputadoIndividualizado ? imputadoNombre || null : null,
            imputadoRut: imputadoIndividualizado ? imputadoRut || null : null,
            victimaNombre: victimaNombre || null,
            diligencias,
            diligenciasOtras: diligenciasOtras || null,
            plazoInforme: plazoInforme || null,
            urgencia,
            formaRemision: formaRemision || null,
            instrucciones: instrucciones || null,
          },
        },
      },
    });
  } catch (error: any) {
    if (error?.code === "P2002" && error?.meta?.target?.includes("rit")) {
      redirect("/causas/nueva?error=rit-duplicado");
    }
    throw error;
  }

  await publicarCausaEnDiscord(causa.id, "Causa creada — Orden de investigar emitida");
  redirect(`/causas/${causa.id}`);
}

export default async function NuevaCausaPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol as string | undefined;

  if (!rol || !ROLES_CON_ACCESO.includes(rol)) {
    redirect("/dashboard?error=sin-permiso");
  }

  return (
    <DashboardShell rol={rol} titulo="Registrar nueva causa">
      <form action={crearCausa} className="max-w-2xl panel-card p-6 grid gap-6">
        {rol === "ADMIN" && (
          <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200/60 rounded-lg px-3 py-2">
            Estás registrando esta causa como Corte Suprema, actuando en calidad de fiscal para fines de prueba.
          </p>
        )}
        {searchParams?.error === "sin-articulo" && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200/60 text-red-700 rounded-lg px-3 py-2.5 text-sm">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            Debes marcar al menos un artículo del Código Penal como delito imputado.
          </div>
        )}
        {searchParams?.error === "rit-duplicado" && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200/60 text-red-700 rounded-lg px-3 py-2.5 text-sm">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            Ya existe una causa registrada con ese RIT. Usa un número distinto (ej. agrega un guion y el año si se repite).
          </div>
        )}

        {/* ---------- Datos generales ---------- */}
        <div className="grid gap-3">
          <p className="eyebrow text-blue-700">Datos generales</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-grafito/60 mb-1">RIT</label>
              <input name="rit" required placeholder="001-2026" className="w-full border border-grafito/15 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-grafito/60 mb-1">RUC (opcional)</label>
              <input name="ruc" placeholder="2500123456-7" className="w-full border border-grafito/15 rounded-lg px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-grafito/60 mb-1">Caratulado</label>
            <input name="caratulado" required placeholder="Fisco vs. Juan Pérez" className="w-full border border-grafito/15 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-grafito/60 mb-1">Tribunal (opcional)</label>
            <input name="tribunal" placeholder="Primer Juzgado de Garantía de Santiago" className="w-full border border-grafito/15 rounded-lg px-3 py-2" />
          </div>
        </div>

        {/* ---------- Delito ---------- */}
        <div>
          <label className="block text-sm text-grafito/60 mb-1">Delito(s) imputado(s) — Código Penal</label>
          <p className="text-[11px] text-grafito/40 mb-2">
            Marca uno o más artículos. Despliega cada título para ver sus delitos; pasa el cursor sobre uno para ver la pena.
          </p>
          <div className="border border-grafito/15 rounded-lg max-h-72 overflow-y-auto divide-y divide-grafito/10">
            {codigoPenalPorTitulo().map(({ titulo, articulos }) => (
              <details key={titulo} className="group px-3">
                <summary className="cursor-pointer list-none py-2.5 text-sm font-medium text-grafito/70 flex items-center justify-between select-none">
                  {titulo}
                  <span className="text-grafito/35 text-xs transition-transform group-open:rotate-180">▾</span>
                </summary>
                <div className="pb-3 pl-2 grid gap-1.5">
                  {articulos.map((a) => (
                    <label key={a.numero} title={a.pena} className="flex items-start gap-2 text-sm text-grafito/80 cursor-pointer hover:text-marino-950">
                      <input type="checkbox" name="articulos" value={a.numero} className="mt-1 accent-marino-950" />
                      <span>Art. {a.numero} — {a.delito}</span>
                    </label>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-grafito/60 mb-1">Descripción de los hechos</label>
          <textarea name="descripcion" required rows={4} className="w-full border border-grafito/15 rounded-lg px-3 py-2" />
        </div>

        {/* ---------- Imputado ---------- */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 grid gap-3">
          <p className="eyebrow text-blue-700">Imputado</p>
          <label className="flex items-center gap-2 text-sm text-grafito/70">
            <input type="checkbox" name="imputadoIndividualizado" defaultChecked className="accent-marino-950" />
            El imputado está individualizado (se conoce su identidad)
          </label>
          <p className="text-[11px] text-grafito/40 -mt-2">
            Desmarca esta casilla si aún no se sabe quién es — los documentos oficiales dirán "sujeto(s) por individualizar".
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-grafito/55 mb-1">Nombre del imputado</label>
              <input name="imputadoNombre" placeholder="Desconocido / sin individualizar" className="w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-grafito/55 mb-1">RUT / Pasaporte</label>
              <input name="imputadoRut" placeholder="Desconocido" className="w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        {/* ---------- Orden de investigar ---------- */}
        <div className="rounded-xl border border-grafito/10 p-4 grid gap-4">
          <div>
            <p className="eyebrow text-blue-700 mb-1">Orden de investigar</p>
            <p className="text-[11px] text-grafito/40">
              Se genera automáticamente en PDF al crear la causa, dirigida a la unidad policial. Todos estos campos son opcionales.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-grafito/55 mb-1">Fiscalía</label>
              <input name="fiscalia" placeholder="Fiscalía Local de Arica" className="w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-grafito/55 mb-1">Unidad policial destinataria</label>
              <select name="unidadPolicial" className="w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm bg-hueso/40">
                <option value="PDI">Policía de Investigaciones (PDI)</option>
                <option value="CARABINEROS">Carabineros de Chile</option>
                <option value="AMBAS">Ambas</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-grafito/55 mb-1">Víctima(s)</label>
            <input name="victimaNombre" placeholder="N/A si se reserva identidad" className="w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-xs text-grafito/55 mb-2">Diligencias ordenadas</label>
            <div className="grid gap-1.5">
              {DILIGENCIAS_ORDEN_INVESTIGAR.map((d) => (
                <label key={d.codigo} className="flex items-start gap-2 text-sm text-grafito/80 cursor-pointer">
                  <input type="checkbox" name={`diligencia_${d.codigo}`} className="mt-1 accent-marino-950" />
                  <span>{d.texto}</span>
                </label>
              ))}
            </div>
            <input name="diligenciasOtras" placeholder="Otras diligencias (opcional)" className="w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm mt-2" />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-grafito/55 mb-1">Plazo para informar resultados</label>
              <input name="plazoInforme" placeholder="10 días hábiles" className="w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-grafito/55 mb-1">Urgencia</label>
              <select name="urgencia" className="w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm bg-hueso/40">
                <option value="ORDINARIA">Ordinaria</option>
                <option value="CON_DETENIDO">Con detenido (art. 131 CPP)</option>
                <option value="SUMA_URGENCIA">Suma urgencia</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-grafito/55 mb-1">Forma de remisión del informe</label>
            <input name="formaRemision" placeholder="Oficio / Sistema SAF / correo institucional" className="w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-xs text-grafito/55 mb-1">Instrucciones específicas al personal actuante</label>
            <textarea name="instrucciones" rows={3} placeholder="Reserva de identidad de testigos, medidas de protección a la víctima, etc." className="w-full border border-grafito/15 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <button className="button-primary justify-self-start">Registrar causa</button>
      </form>
    </DashboardShell>
  );
}
