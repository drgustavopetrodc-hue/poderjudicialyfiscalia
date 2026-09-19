"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";

export default function SubirVideoFiscal({ causaId }: { causaId: string }) {
  const [progreso, setProgreso] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function manejarSubida(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setError(null);
    setProgreso(0);

    try {
      await upload(archivo.name, archivo, {
        access: "public",
        handleUploadUrl: "/api/fiscal/adjuntos/upload",
        clientPayload: JSON.stringify({ causaId }),
        onUploadProgress: ({ percentage }) => setProgreso(percentage),
      });
      setProgreso(null);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("No se pudo subir el video. Verifica el formato/tamaño e intenta de nuevo.");
      setProgreso(null);
    }
  }

  return (
    <div className="grid gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={manejarSubida}
        disabled={progreso !== null}
        className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs disabled:opacity-50"
      />
      {progreso !== null && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
          <div className="h-full bg-blue-600 transition-all" style={{ width: `${progreso}%` }} />
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-[11px] text-grafito/40">Formatos: MP4, WebM, MOV · Hasta 5 GB. Se sube directo y por partes, sin pasar por el servidor.</p>
    </div>
  );
}
