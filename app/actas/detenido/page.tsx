import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";

export const dynamic = "force-dynamic";

const DERECHOS = [
  "Motivo de la detención y delito imputado",
  "Derecho a guardar silencio o declarar sin juramento",
  "Derecho a informar la detención a un familiar o tercero",
  "Derecho a entrevistarse con un abogado desde la detención",
  "Derecho a ser asistido por un abogado en diligencias y declaración",
  "Derecho a solicitar defensor penal público",
  "Derecho a no sufrir torturas ni tratos crueles o degradantes",
  "Derecho a ser conducido sin demora ante el tribunal",
  "Derecho a conocer el estado de la investigación, salvo secreto",
  "Derecho a comunicarse con su consulado si es extranjero",
];

type ActaResumen = {
  id: string;
  detenidoNombre: string;
  fechaDiligencia: string;
};

async function crearActa(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const rol = (session?.user as any)?.rol as string | undefined;
  if (!userId || !rol || !["FUNCIONARIO", "ADMIN"].includes(rol)) return;

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
  const horaTermino = required("horaTermino");

  if (!unidadPolicial || !fechaDiligencia || !horaDetencion || !horaLectura || !lugarDetencion || !funcionarioNombre || !funcionarioPlaca || !detenidoNombre || !detenidoRunPasaporte || !detenidoNacionalidad || !detenidoNacimientoEdad || !detenidoDomicilio || !delitosImputados || !causalDetencion || !horaTermino) return;

  const acta = await (prisma as any).actaDerechosDetenido.create({
    data: {
      funcionarioId: userId,
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
      requiereInterprete: formData.get("requiereInterprete") === "on",
      interpreteDetalle: required("interpreteDetalle") || null,
      delitosImputados,
      causalDetencion,
      ordenNumero: required("ordenNumero") || null,
      derechosInformados: DERECHOS.map((_, index) => formData.get(`derecho_${index}`) === "on" ? String(index) : "").filter(Boolean),
      silencioEjercido: formData.get("silencioEjercido") === "on",
      silencioObservaciones: required("silencioObservaciones") || null,
      avisoFamiliar: formData.get("avisoFamiliar") === "on",
      avisoDetalle: required("avisoDetalle") || null,
      entrevistaAbogado: formData.get("entrevistaAbogado") === "on",
      abogadoDetalle: required("abogadoDetalle") || null,
      defensorPublico: formData.get("defensorPublico") === "on",
      comunicacionConsular: required("comunicacionConsular") || "NA",
      lesionesDetalle: required("lesionesDetalle") || null,
      sinLesionesAparentes: formData.get("sinLesionesAparentes") === "on",
      observaciones: required("observaciones") || null,
      detenidoFirma: required("detenidoFirma") || null,
      testigoFirma: required("testigoFirma") || null,
      horaTermino,
    },
  });

  redirect(`/actas/detenido?creada=${acta.id}`);
}

function Campo({ label, name, required = false, type = "text" }: { label: string; name: string; required?: boolean; type?: string }) {
  return (
    <label className="block text-sm text-grafito/70">
      {label}
      <input name={name} type={type} required={required} className="mt-1 w-full rounded-lg border border-grafito/15 px-3 py-2" />
    </label>
  );
}

function Seccion({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="panel-card p-5"><h2 className="font-display text-xl mb-4">{title}</h2>{children}</section>;
}

export default async function ActaDetenidoPage({ searchParams }: { searchParams?: { creada?: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const rol = (session?.user as any)?.rol as string | undefined;
  if (!userId || !rol || !["FUNCIONARIO", "ADMIN"].includes(rol)) redirect("/login");

  const actas: ActaResumen[] = await (prisma as any).actaDerechosDetenido.findMany({ where: { funcionarioId: userId }, orderBy: { creadoEn: "desc" }, take: 10 });

  return (
    <DashboardShell rol={rol} titulo="Acta de derechos al detenido">
      <div className="mx-auto max-w-5xl space-y-5">
        {searchParams?.creada && <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"><strong>Acta creada.</strong> <a className="underline" href={`/api/actas/detenido/${searchParams.creada}/pdf`}>Descargar PDF</a></div>}
        <form action={crearActa} className="space-y-5">
          <Seccion title="I. Datos de la diligencia">
            <div className="grid gap-4 md:grid-cols-2">
              <Campo label="Unidad policial" name="unidadPolicial" required />
              <Campo label="Fecha de la diligencia" name="fechaDiligencia" type="date" required />
              <Campo label="Hora de la detención" name="horaDetencion" type="time" required />
              <Campo label="Hora de lectura de derechos" name="horaLectura" type="time" required />
              <Campo label="Lugar de la detención" name="lugarDetencion" required />
              <Campo label="RUC" name="ruc" />
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
              <Campo label="Detalle de intérprete o discapacidad" name="interpreteDetalle" />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <label><input type="checkbox" name="esMenor" className="mr-2" />Es menor de edad</label>
              <label><input type="checkbox" name="requiereInterprete" className="mr-2" />Requiere intérprete o apoyo de comprensión</label>
            </div>
          </Seccion>

          <Seccion title="III. Motivo de la detención">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-grafito/70 md:col-span-2">Delito(s) imputado(s)<textarea name="delitosImputados" required className="mt-1 min-h-20 w-full rounded-lg border border-grafito/15 px-3 py-2" /></label>
              <label className="text-sm text-grafito/70">Causal de detención<select name="causalDetencion" required className="mt-1 w-full rounded-lg border border-grafito/15 px-3 py-2"><option value="FLAGRANCIA">Flagrancia (arts. 129-130 CPP)</option><option value="ORDEN_JUDICIAL">Orden judicial previa (art. 127 CPP)</option><option value="INCUMPLIMIENTO_CITACION">Incumplimiento de citación (art. 33 CPP)</option><option value="OTRA">Otra</option></select></label>
              <Campo label="N° de orden / detalle de otra causal" name="ordenNumero" />
            </div>
          </Seccion>

          <Seccion title="IV. Derechos informados">
            <div className="grid gap-2">{DERECHOS.map((derecho, index) => <label key={derecho}><input type="checkbox" name={`derecho_${index}`} defaultChecked className="mr-2" />{derecho}</label>)}</div>
          </Seccion>

          <Seccion title="V. Ejercicio de derechos">
            <div className="grid gap-4 md:grid-cols-2">
              <label><input type="checkbox" name="silencioEjercido" className="mr-2" />Ejerció derecho a guardar silencio</label><Campo label="Observaciones sobre declaración" name="silencioObservaciones" />
              <label><input type="checkbox" name="avisoFamiliar" className="mr-2" />Aviso a familiar / tercero</label><Campo label="Nombre, parentesco y hora del aviso" name="avisoDetalle" />
              <label><input type="checkbox" name="entrevistaAbogado" className="mr-2" />Entrevista con abogado</label><Campo label="Nombre del abogado y hora" name="abogadoDetalle" />
              <label><input type="checkbox" name="defensorPublico" className="mr-2" />Solicita defensor penal público</label>
              <label className="text-sm text-grafito/70">Comunicación consular<select name="comunicacionConsular" className="mt-1 w-full rounded-lg border border-grafito/15 px-3 py-2"><option value="NA">N/A</option><option value="SI">Sí</option><option value="NO">No</option></select></label>
            </div>
          </Seccion>

          <Seccion title="VI. Lesiones y observaciones">
            <div className="grid gap-4"><Campo label="Lugar y resultado de constatación de lesiones" name="lesionesDetalle" /><label><input type="checkbox" name="sinLesionesAparentes" className="mr-2" />No presenta lesiones aparentes</label><label className="text-sm text-grafito/70">Observaciones adicionales<textarea name="observaciones" className="mt-1 min-h-24 w-full rounded-lg border border-grafito/15 px-3 py-2" /></label></div>
          </Seccion>

          <Seccion title="VII. Firmas y término">
            <div className="grid gap-4 md:grid-cols-3"><Campo label="Firma / nombre del detenido o negativa" name="detenidoFirma" /><Campo label="Testigo actuante" name="testigoFirma" /><Campo label="Hora de término" name="horaTermino" type="time" required /></div>
          </Seccion>
          <button className="button-primary" type="submit">Guardar y generar acta PDF</button>
        </form>

        {actas.length > 0 && <Seccion title="Actas recientes"><div className="space-y-2">{actas.map((acta) => <div key={acta.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-grafito/10 pb-2 text-sm"><span>{acta.detenidoNombre} · {acta.fechaDiligencia}</span><a className="button-outline" href={`/api/actas/detenido/${acta.id}/pdf`}>Descargar PDF</a></div>)}</div></Seccion>}
      </div>
    </DashboardShell>
  );
}
