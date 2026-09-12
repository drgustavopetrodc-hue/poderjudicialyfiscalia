import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import DashboardShell from "@/components/DashboardShell";
import { ToggleDetailField, ToggleNote } from "./FormToggles";
import { CausalDetencionField, LesionesField } from "./CamposCondicionales";
import { registrarAuditoria } from "@/lib/auditoria";
import { esFiscalRegional } from "@/lib/identidad";

export const dynamic = "force-dynamic";

type SessionUser = { id?: string; rol?: string; discordId?: string };

const DERECHOS: { label: string; articulo: string }[] = [
  { label: "Motivo de la detención y delito imputado", articulo: "Art. 135 CPP" },
  { label: "Derecho a guardar silencio o declarar sin juramento", articulo: "Arts. 93 g), 135 CPP" },
  { label: "Derecho a informar la detención a un familiar o tercero", articulo: "Art. 94 d) CPP" },
  { label: "Derecho a entrevistarse con un abogado desde la detención", articulo: "Art. 94 f) CPP" },
  { label: "Derecho a ser asistido por un abogado en diligencias y declaración", articulo: "Arts. 8°, 93 b) CPP" },
  { label: "Derecho a solicitar defensor penal público", articulo: "Ley 19.718" },
  { label: "Derecho a no sufrir torturas ni tratos crueles o degradantes", articulo: "Art. 94 a) CPP" },
  { label: "Derecho a ser conducido sin demora ante el tribunal", articulo: "Art. 131 CPP" },
  { label: "Derecho a conocer el estado de la investigación, salvo secreto", articulo: "Art. 182 CPP" },
  { label: "Derecho a comunicarse con su consulado si es extranjero", articulo: "Conv. Viena, art. 36" },
];

const ERROR_MESSAGES: Record<string, string> = {
  incompleto: "Faltan campos obligatorios por completar. Revisa el formulario e inténtalo nuevamente.",
  servidor: "Ocurrió un error al guardar el acta. Inténtalo nuevamente en unos segundos.",
  permiso: "No tienes permisos para realizar esta acción.",
};

type ActaResumen = {
  id: string;
  detenidoNombre: string;
  fechaDiligencia: string;
  causaId?: string | null;
};

async function adjuntarActa(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  const actaId = String(formData.get("actaId") ?? "");
  const causaId = String(formData.get("causaId") ?? "");

  if (!user?.id || !actaId || !causaId || !["FISCAL", "ADMIN"].includes(user.rol ?? "")) {
    redirect("/actas/detenido?error=permiso");
  }

  const [causa, acta] = await Promise.all([
    prisma.causa.findUnique({ where: { id: causaId }, select: { fiscalId: true } }),
    (prisma as any).actaDerechosDetenido.findUnique({ where: { id: actaId }, select: { causaId: true } }),
  ]);

  const puedeAdjuntar = user!.rol === "ADMIN"
    || esFiscalRegional(user!.discordId)
    || causa?.fiscalId === user!.id;
  if (!causa || !acta || !puedeAdjuntar || acta.causaId) {
    redirect("/actas/detenido?error=permiso");
  }

  try {
    await (prisma as any).actaDerechosDetenido.update({ where: { id: actaId }, data: { causaId } });
    await registrarAuditoria({ actorId: user!.id, accion: "ADJUNTAR_ACTA_CAUSA", entidad: "ActaDerechosDetenido", entidadId: actaId, detalle: `Causa: ${causaId}` });
  } catch (err) {
    console.error("Error al adjuntar acta:", err);
    redirect("/actas/detenido?error=servidor");
  }

  revalidatePath("/actas/detenido");
  redirect(`/actas/detenido?adjuntada=${actaId}`);
}

async function crearActa(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;

  if (!user?.id || !["FUNCIONARIO", "FISCAL", "ADMIN"].includes(user.rol ?? "")) {
    redirect("/actas/detenido?error=permiso");
  }

  const required = (name: string) => String(formData.get(name) ?? "").trim();

  const unidadPolicial = required("unidadPolicial");
  const fechaDiligencia = required("fechaDiligencia");
  const horaDetencion = required("horaDetencion");
  const horaLectura = required("horaLectura");
  const lugarDetencion = required("lugarDetencion");
  const funcionarioNombre = required("funcionarioNombre");
  const funcionarioPlaca = required("funcionarioPlaca");
  const detenidoNombre = required("detenidoNombre");
  const detenidoRunPasaporte = required("detenidoRunPasaporte");
  const detenidoNacionalidad = required("detenidoNacionalidad");
  const detenidoNacimientoEdad = required("detenidoNacimientoEdad");
  const detenidoDomicilio = required("detenidoDomicilio");
  const delitosImputados = required("delitosImputados");
  const causalDetencion = required("causalDetencion");
  const ordenNumero = required("ordenNumero");
  const horaTermino = required("horaTermino");

  const camposBase = [
    unidadPolicial,
    fechaDiligencia,
    horaDetencion,
    horaLectura,
    lugarDetencion,
    funcionarioNombre,
    funcionarioPlaca,
    detenidoNombre,
    detenidoRunPasaporte,
    detenidoNacionalidad,
    detenidoNacimientoEdad,
    detenidoDomicilio,
    delitosImputados,
    causalDetencion,
    horaTermino,
  ];

  if (camposBase.some((campo) => !campo)) {
    redirect("/actas/detenido?error=incompleto");
  }

  // La causal "orden judicial previa" u "otra" exige identificar la orden o el fundamento.
  if ((causalDetencion === "ORDEN_JUDICIAL" || causalDetencion === "OTRA") && !ordenNumero) {
    redirect("/actas/detenido?error=incompleto");
  }

  const requiereInterprete = formData.get("requiereInterprete") === "on";
  const interpreteDetalle = required("interpreteDetalle");
  if (requiereInterprete && !interpreteDetalle) {
    redirect("/actas/detenido?error=incompleto");
  }

  const avisoFamiliar = formData.get("avisoFamiliar") === "on";
  const avisoDetalle = required("avisoDetalle");
  if (avisoFamiliar && !avisoDetalle) {
    redirect("/actas/detenido?error=incompleto");
  }

  const entrevistaAbogado = formData.get("entrevistaAbogado") === "on";
  const abogadoDetalle = required("abogadoDetalle");
  if (entrevistaAbogado && !abogadoDetalle) {
    redirect("/actas/detenido?error=incompleto");
  }

  const sinLesionesAparentes = formData.get("sinLesionesAparentes") === "on";

  let acta;
  try {
    acta = await (prisma as any).actaDerechosDetenido.create({
      data: {
        funcionarioId: user!.id,
        unidadPolicial,
        fechaDiligencia,
        horaDetencion,
        horaLectura,
        lugarDetencion,
        funcionarioNombre,
        funcionarioPlaca,
        ruc: required("ruc") || null,
        detenidoNombre,
        detenidoRunPasaporte,
        detenidoNacionalidad,
        detenidoNacimientoEdad,
        detenidoDomicilio,
        esMenor: formData.get("esMenor") === "on",
        requiereInterprete,
        interpreteDetalle: interpreteDetalle || null,
        delitosImputados,
        causalDetencion,
        ordenNumero: ordenNumero || null,
        derechosInformados: DERECHOS.map((_, index) =>
          formData.get(`derecho_${index}`) === "on" ? String(index) : ""
        ).filter(Boolean),
        silencioEjercido: formData.get("silencioEjercido") === "on",
        silencioObservaciones: required("silencioObservaciones") || null,
        avisoFamiliar,
        avisoDetalle: avisoDetalle || null,
        entrevistaAbogado,
        abogadoDetalle: abogadoDetalle || null,
        defensorPublico: formData.get("defensorPublico") === "on",
        comunicacionConsular: required("comunicacionConsular") || "NA",
        lesionesDetalle: sinLesionesAparentes ? null : required("lesionesDetalle") || null,
        sinLesionesAparentes,
        observaciones: required("observaciones") || null,
        detenidoFirma: required("detenidoFirma") || null,
        testigoFirma: required("testigoFirma") || null,
        horaTermino,
      },
    });
  } catch (err) {
    console.error("Error al crear acta:", err);
    redirect("/actas/detenido?error=servidor");
  }

  await registrarAuditoria({ actorId: user!.id, accion: "CREAR_ACTA_DERECHOS", entidad: "ActaDerechosDetenido", entidadId: acta.id, detalle: `Detenido: ${detenidoNombre}` });

  revalidatePath("/actas/detenido");
  redirect(`/actas/detenido?creada=${acta.id}`);
}

function Campo({
  label,
  name,
  required = false,
  type = "text",
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm text-grafito/70" htmlFor={name}>
      {label}
      {required && <span className="text-red-500"> *</span>}
      <input id={name} name={name} type={type} required={required} className="mt-1 w-full rounded-lg border border-grafito/15 px-3 py-2" />
    </label>
  );
}

function Seccion({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel-card p-5">
      <h2 className="font-display text-xl mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default async function ActaDetenidoPage({
  searchParams,
}: {
  searchParams?: { creada?: string; adjuntada?: string; error?: string };
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  if (!user?.id || !user.rol || !["FUNCIONARIO", "ADMIN", "FISCAL"].includes(user.rol)) {
    redirect("/login");
  }
  const rol = user.rol!;
  const userId = user.id!;

  const actas: ActaResumen[] = await (prisma as any).actaDerechosDetenido.findMany({
    where: rol === "FISCAL"
      ? esFiscalRegional(user.discordId)
        ? undefined
        : { OR: [{ causaId: null }, { causa: { fiscalId: userId } }] }
      : { funcionarioId: userId },
    orderBy: { creadoEn: "desc" },
    take: 20,
  });
  const actasDisponibles = actas.filter((acta) => !acta.causaId);
  const causas =
    rol === "FISCAL"
      ? await prisma.causa.findMany({
          where: esFiscalRegional(user.discordId) ? undefined : { fiscalId: userId },
          select: { id: true, rit: true, caratulado: true },
          orderBy: { creadaEn: "desc" },
        })
      : [];

  const errorMessage = searchParams?.error ? ERROR_MESSAGES[searchParams.error] ?? ERROR_MESSAGES.servidor : null;

  return (
    <DashboardShell rol={rol} titulo="Acta de derechos al detenido">
      <div className="mx-auto max-w-5xl space-y-5">
        {errorMessage && (
          <div role="alert" aria-live="polite" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <strong>No se pudo completar la acción.</strong> {errorMessage}
          </div>
        )}
        {searchParams?.creada && (
          <div role="status" aria-live="polite" className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <strong>Acta creada.</strong>{" "}
            <a className="underline" href={`/api/actas/detenido/${searchParams.creada}/pdf`}>
              Descargar PDF
            </a>
          </div>
        )}
        {searchParams?.adjuntada && (
          <div role="status" aria-live="polite" className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <strong>Acta adjuntada a la causa.</strong>{" "}
            <a className="underline" href={`/api/actas/detenido/${searchParams.adjuntada}/pdf`}>
              Descargar PDF
            </a>
          </div>
        )}

        {(["FUNCIONARIO", "FISCAL", "ADMIN"] as string[]).includes(rol) && (
          <form action={crearActa} className="space-y-5">
            <Seccion title="I. Datos de la diligencia">
              <div className="grid gap-4 md:grid-cols-2">
                <Campo label="Unidad policial" name="unidadPolicial" required />
                <Campo label="Fecha de la diligencia" name="fechaDiligencia" type="date" required />
                <Campo label="Hora de la detención" name="horaDetencion" type="time" required />
                <Campo label="Hora de lectura de derechos" name="horaLectura" type="time" required />
                <Campo label="Lugar de la detención" name="lugarDetencion" required />
                <Campo label="RUC (si ya fue asignado)" name="ruc" />
                <Campo label="Funcionario que informa" name="funcionarioNombre" required />
                <Campo label="Grado / placa / RUT institucional" name="funcionarioPlaca" required />
              </div>
            </Seccion>

            <Seccion title="II. Identificación del detenido/a">
              <div className="grid gap-4 md:grid-cols-2">
                <Campo label="Nombre completo" name="detenidoNombre" required />
                <Campo label="RUN / Pasaporte" name="detenidoRunPasaporte" required />
                <Campo label="Nacionalidad" name="detenidoNacionalidad" required />
                <Campo label="Fecha de nacimiento / Edad" name="detenidoNacimientoEdad" required />
                <Campo label="Domicilio" name="detenidoDomicilio" required />
              </div>
              <fieldset className="mt-4 grid gap-2 sm:grid-cols-2">
                <legend className="sr-only">Condiciones especiales del detenido</legend>
                <ToggleNote
                  checkboxName="esMenor"
                  checkboxLabel="Es menor de edad"
                  note="Aplican las garantías reforzadas de la Ley N° 20.084 (Responsabilidad Penal Adolescente): se debe procurar la presencia de un adulto responsable y notificar al defensor especializado."
                />
                <ToggleDetailField
                  checkboxName="requiereInterprete"
                  checkboxLabel="Requiere intérprete o apoyo de comprensión"
                  detailName="interpreteDetalle"
                  detailLabel="Idioma o tipo de apoyo requerido"
                  requireDetailWhenChecked
                />
              </fieldset>
            </Seccion>

            <Seccion title="III. Motivo de la detención">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-grafito/70 md:col-span-2" htmlFor="delitosImputados">
                  Delito(s) imputado(s) <span className="text-red-500">*</span>
                  <textarea
                    id="delitosImputados"
                    name="delitosImputados"
                    required
                    className="mt-1 min-h-20 w-full rounded-lg border border-grafito/15 px-3 py-2"
                  />
                </label>
                <CausalDetencionField />
              </div>
            </Seccion>

            <Seccion title="IV. Derechos informados (art. 135 CPP)">
              <fieldset className="grid gap-2">
                <legend className="sr-only">Derechos informados al detenido</legend>
                {DERECHOS.map((derecho, index) => (
                  <label key={derecho.label} className="flex items-start gap-2 text-sm text-grafito/80">
                    <input type="checkbox" name={`derecho_${index}`} defaultChecked className="mt-0.5" />
                    <span>
                      {derecho.label} <span className="text-grafito/40">({derecho.articulo})</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            </Seccion>

            <Seccion title="V. Ejercicio de derechos">
              <div className="grid gap-3 md:grid-cols-2">
                <ToggleDetailField
                  checkboxName="silencioEjercido"
                  checkboxLabel="Ejerció derecho a guardar silencio"
                  detailName="silencioObservaciones"
                  detailLabel="Observaciones sobre la declaración"
                  multiline
                />
                <ToggleDetailField
                  checkboxName="avisoFamiliar"
                  checkboxLabel="Aviso a familiar / tercero"
                  detailName="avisoDetalle"
                  detailLabel="Nombre, parentesco y hora del aviso"
                  requireDetailWhenChecked
                />
                <ToggleDetailField
                  checkboxName="entrevistaAbogado"
                  checkboxLabel="Entrevista con abogado"
                  detailName="abogadoDetalle"
                  detailLabel="Nombre del abogado y hora"
                  requireDetailWhenChecked
                />
                <div className="rounded-lg border border-grafito/10 p-3">
                  <label className="flex items-center gap-2 text-sm text-grafito/80">
                    <input type="checkbox" name="defensorPublico" />
                    Solicita defensor penal público
                  </label>
                  <label className="mt-3 block text-sm text-grafito/70" htmlFor="comunicacionConsular">
                    Comunicación consular (si es extranjero)
                    <select
                      id="comunicacionConsular"
                      name="comunicacionConsular"
                      defaultValue="NA"
                      className="mt-1 w-full rounded-lg border border-grafito/15 px-3 py-2"
                    >
                      <option value="NA">N/A</option>
                      <option value="SI">Sí</option>
                      <option value="NO">No</option>
                    </select>
                  </label>
                </div>
              </div>
            </Seccion>

            <Seccion title="VI. Lesiones y observaciones">
              <div className="grid gap-4">
                <LesionesField />
                <label className="text-sm text-grafito/70" htmlFor="observaciones">
                  Observaciones adicionales
                  <textarea
                    id="observaciones"
                    name="observaciones"
                    className="mt-1 min-h-24 w-full rounded-lg border border-grafito/15 px-3 py-2"
                  />
                </label>
              </div>
            </Seccion>

            <Seccion title="VII. Firmas y término">
              <div className="grid gap-4 md:grid-cols-3">
                <Campo label="Firma / nombre del detenido o negativa" name="detenidoFirma" />
                <Campo label="Testigo actuante" name="testigoFirma" />
                <Campo label="Hora de término" name="horaTermino" type="time" required />
              </div>
            </Seccion>

            <button className="button-primary" type="submit">
              Guardar y generar acta PDF
            </button>
          </form>
        )}

        {rol === "FISCAL" && (
          <Seccion title="Adjuntar acta a una causa">
            {actasDisponibles.length === 0 ? (
              <p className="text-sm text-grafito/55">No hay actas disponibles para adjuntar.</p>
            ) : (
              <form action={adjuntarActa} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] items-end">
                <label className="text-sm text-grafito/70" htmlFor="actaId">
                  Acta del detenido
                  <select id="actaId" name="actaId" required className="mt-1 w-full rounded-lg border border-grafito/15 px-3 py-2">
                    {actasDisponibles.map((acta) => (
                      <option key={acta.id} value={acta.id}>
                        {acta.detenidoNombre} · {acta.fechaDiligencia}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-grafito/70" htmlFor="causaId">
                  Causa
                  <select id="causaId" name="causaId" required className="mt-1 w-full rounded-lg border border-grafito/15 px-3 py-2">
                    {causas.map((causa) => (
                      <option key={causa.id} value={causa.id}>
                        {causa.rit} · {causa.caratulado}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="button-primary" type="submit">
                  Adjuntar acta
                </button>
              </form>
            )}
          </Seccion>
        )}

        {actas.length > 0 && (
          <Seccion title="Actas recientes">
            <div className="space-y-2">
              {actas.map((acta) => (
                <div key={acta.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-grafito/10 pb-2 text-sm">
                  <span>
                    {acta.detenidoNombre} · {acta.fechaDiligencia}
                  </span>
                  <a className="button-outline" href={`/api/actas/detenido/${acta.id}/pdf`}>
                    Descargar PDF
                  </a>
                </div>
              ))}
            </div>
          </Seccion>
        )}
      </div>
    </DashboardShell>
  );
}