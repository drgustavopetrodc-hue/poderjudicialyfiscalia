import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Service = { href: string; title: string; description: string; roles?: string[] };

export default async function TramiteFacilPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { rol?: string } | undefined;
  if (!user?.rol) redirect("/login");

  const services: Service[] = [
    { href: "/tramite-facil/antecedentes", title: "Certificado de Antecedentes", description: "Obtén un certificado PDF sobre los antecedentes registrados del usuario consultante." },
    { href: "/tramite-facil/partes-policiales", title: "Registro Partes Policiales", description: "Registra detenciones y otros procedimientos policiales que deban quedar documentados.", roles: ["FUNCIONARIO"] },
    { href: "/tramite-facil/detencion", title: "Registro Detención", description: "Completa el acta de lectura de derechos y genera su documento PDF.", roles: ["FUNCIONARIO", "FISCAL", "ADMIN"] },
    { href: "/tramite-facil/solicitudes", title: "Apertura de Solicitud", description: "Crea y consulta solicitudes dirigidas a Fiscalía, Poder Judicial o Defensoría Penal." },
    { href: "/tramite-facil/denuncia-facil", title: "Denuncia Fácil", description: "Presenta una denuncia con los datos esenciales de la víctima, victimario y lugar de los hechos." },
  ];

  return (
    <DashboardShell rol={user.rol} titulo="Trámite Fácil">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <p className="eyebrow">Servicios simplificados</p>
          <h1 className="font-display text-3xl text-[#12486d]">Trámite Fácil</h1>
          <p className="mt-2 max-w-2xl text-sm text-grafito/60">Accede a certificados, registros y solicitudes desde un solo lugar.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.filter((service) => !service.roles || service.roles.includes(user.rol!)).map((service) => (
            <Link key={service.href} href={service.href} className="ojv-card block p-5 transition hover:border-[#5b8038] hover:shadow-md">
              <p className="ojv-label">Trámite institucional</p>
              <h2 className="mt-2 font-display text-xl text-[#12486d]">{service.title}</h2>
              <p className="mt-2 text-sm leading-6 text-grafito/60">{service.description}</p>
              <span className="mt-5 inline-flex text-xs font-bold text-[#5b8038]">Ingresar →</span>
            </Link>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
