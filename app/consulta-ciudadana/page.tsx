import { prisma } from "@/lib/prisma";
import { formatearRut, nombreLegal } from "@/lib/identidad";

export const dynamic = "force-dynamic";

type TipoConsulta = "abogados" | "funcionarios";

function textoParametro(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value ?? "").trim();
}

function normalizarTexto(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-CL").trim();
}

export default async function ConsultaCiudadanaPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const tipo: TipoConsulta = textoParametro(searchParams?.tipo) === "funcionarios" ? "funcionarios" : "abogados";
  const nombre = textoParametro(searchParams?.nombre);
  const apellidoPaterno = textoParametro(searchParams?.apellidoPaterno);
  const apellidoMaterno = textoParametro(searchParams?.apellidoMaterno);
  const consultado = Boolean(nombre || apellidoPaterno || apellidoMaterno);
  const filtrosNombre = [nombre, apellidoPaterno, apellidoMaterno].filter(Boolean);

  const personasRegistradas = consultado
    ? await prisma.user.findMany({
        where: {
          ...(tipo === "abogados"
            ? { certificacion: { estado: "APROBADA" } }
            : { rol: { in: ["FISCAL", "JUEZ"] } }),
        },
        select: {
          id: true,
          nombreIC: true,
          name: true,
          rut: true,
          rol: true,
          institucion: true,
          certificacion: { select: { numeroMatricula: true, revisadoEn: true } },
        },
        orderBy: { nombreIC: "asc" },
      })
    : [];
  const partesBuscadas = filtrosNombre.map(normalizarTexto);
  const personas = personasRegistradas.filter((persona) => {
    const nombreCompleto = normalizarTexto(`${persona.nombreIC ?? ""} ${persona.name ?? ""}`);
    return partesBuscadas.every((parte) => nombreCompleto.includes(parte));
  });

  return (
    <main className="min-h-screen bg-hueso px-5 py-10 text-grafito">
      <div className="mx-auto max-w-5xl">
        <header className="mb-7">
          <p className="eyebrow">Consulta ciudadana</p>
          <h1 className="mt-2 font-display text-3xl text-marino-950">Funcionarios y abogados</h1>
          <p className="mt-2 max-w-2xl text-sm text-grafito/60">Consulta pública de personas habilitadas o registradas en el sistema institucional.</p>
        </header>

        <div className="ojv-tabs mb-5">
          <a href="/consulta-ciudadana?tipo=abogados" className={`ojv-tab ${tipo === "abogados" ? "ojv-tab-active" : ""}`}>Abogados certificados</a>
          <a href="/consulta-ciudadana?tipo=funcionarios" className={`ojv-tab ${tipo === "funcionarios" ? "ojv-tab-active" : ""}`}>Fiscales y jueces</a>
        </div>

        <section className="ojv-card">
          <h2 className="font-display text-2xl text-marino-950">{tipo === "abogados" ? "Buscar abogado" : "Buscar fiscal o juez"}</h2>
          <p className="mt-1 text-sm text-grafito/55">Ingresa el nombre separado en sus tres partes.</p>
          <form className="ojv-form mt-5" method="get">
            <input type="hidden" name="tipo" value={tipo} />
            <div className="grid gap-4 md:grid-cols-3">
              <label className="ojv-label">Nombre<input name="nombre" defaultValue={nombre} className="ojv-input" placeholder="Ej. Gabriel" /></label>
              <label className="ojv-label">Apellido paterno<input name="apellidoPaterno" defaultValue={apellidoPaterno} className="ojv-input" placeholder="Ej. Boric" /></label>
              <label className="ojv-label">Apellido materno<input name="apellidoMaterno" defaultValue={apellidoMaterno} className="ojv-input" placeholder="Ej. Font" /></label>
            </div>
            <div className="ojv-actions"><button className="ojv-search">Consultar</button><a href={`/consulta-ciudadana?tipo=${tipo}`} className="ojv-clear">Limpiar</a></div>
          </form>
        </section>

        {consultado && (
          <section className="mt-6">
            <p className="eyebrow mb-3">Resultados: {personas.length}</p>
            {personas.length ? <div className="grid gap-4 md:grid-cols-2">{personas.map((persona) => (
              <article key={persona.id} className="panel-card p-5">
                <p className="eyebrow text-blue-700">{tipo === "abogados" ? "Abogado certificado" : persona.rol === "FISCAL" ? "Fiscal" : "Juez"}</p>
                <h2 className="mt-2 font-display text-xl text-marino-950">{nombreLegal(persona)}</h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-grafito/50">RUT</dt><dd>{persona.rut ? formatearRut(persona.rut) : "No registrado"}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-grafito/50">Institución</dt><dd>{persona.institucion || "Poder Judicial de Chile"}</dd></div>
                  {tipo === "abogados" && <div className="flex justify-between gap-4"><dt className="text-grafito/50">Matrícula</dt><dd>{persona.certificacion?.numeroMatricula || "No registrada"}</dd></div>}
                </dl>
              </article>
            ))}</div> : <div className="rounded-2xl border border-dashed border-grafito/20 bg-white p-10 text-center text-sm text-grafito/55">No se encontraron personas con esos datos.</div>}
          </section>
        )}
      </div>
    </main>
  );
}