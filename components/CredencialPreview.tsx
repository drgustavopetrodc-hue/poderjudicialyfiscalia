import Link from "next/link";
import { Fingerprint, Download } from "lucide-react";
import { ROLES_FUNCIONARIOS, identidadCompleta } from "@/lib/identidad";

type UsuarioParaCredencial = {
  id: string;
  rol: string;
  nombreIC: string | null;
  rut: string | null;
};

/**
 * Tarjeta compacta que muestra la credencial institucional del usuario dentro
 * de su propio panel (juez, fiscal, etc.), sin reemplazar el resto del panel.
 * Usa el mismo endpoint /api/carnet/[userId] que ya genera la imagen PNG real
 * — no duplica el diseño en otro lado.
 */
export default function CredencialPreview({ usuario }: { usuario: UsuarioParaCredencial }) {
  if (!ROLES_FUNCIONARIOS.includes(usuario.rol)) return null;

  const urlCarnet = `/api/carnet/${usuario.id}`;
  const completo = identidadCompleta(usuario);

  return (
    <div className="panel-card p-5 mb-7 flex flex-wrap items-center gap-5">
      {completo ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urlCarnet}
            alt="Credencial institucional"
            className="h-32 w-auto rounded-lg border border-grafito/10 shadow-sm shrink-0"
          />
          <div className="flex-1 min-w-[180px]">
            <p className="eyebrow text-blue-700 flex items-center gap-1.5">
              <Fingerprint size={12} /> Tu credencial institucional
            </p>
            <p className="mt-1 text-sm text-grafito/55">
              Descárgala para tu perfil de Discord o para presentarla dentro del servidor.
            </p>
            <a href={urlCarnet} download className="button-secondary mt-3 inline-flex">
              <Download size={14} /> Descargar credencial
            </a>
          </div>
        </>
      ) : (
        <div>
          <p className="eyebrow text-blue-700 flex items-center gap-1.5">
            <Fingerprint size={12} /> Credencial institucional
          </p>
          <p className="mt-1 text-sm text-grafito/55">
            Completa tu nombre y RUT en tu perfil para poder generar tu credencial.
          </p>
          <Link href="/perfil" className="button-secondary mt-3 inline-flex">
            Ir a mi perfil
          </Link>
        </div>
      )}
    </div>
  );
}
