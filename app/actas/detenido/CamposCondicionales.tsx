"use client";

import { useState } from "react";

export const CAUSALES_DETENCION = [
  { value: "FLAGRANCIA", label: "Flagrancia (arts. 129-130 CPP)" },
  { value: "ORDEN_JUDICIAL", label: "Orden judicial previa (art. 127 CPP)" },
  { value: "INCUMPLIMIENTO_CITACION", label: "Incumplimiento de citación (art. 33 CPP)" },
  { value: "OTRA", label: "Otra" },
] as const;


export function CausalDetencionField({
  defaultValue = "FLAGRANCIA",
}: {
  defaultValue?: (typeof CAUSALES_DETENCION)[number]["value"];
}) {
  const [causal, setCausal] = useState<string>(defaultValue);
  const necesitaDetalle = causal === "ORDEN_JUDICIAL" || causal === "OTRA";

  return (
    <>
      <label className="text-sm text-grafito/70">
        Causal de detención <span className="text-red-500">*</span>
        <select
          name="causalDetencion"
          required
          value={causal}
          onChange={(e) => setCausal(e.target.value)}
          className="mt-1 w-full rounded-lg border border-grafito/15 px-3 py-2"
        >
          {CAUSALES_DETENCION.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      {necesitaDetalle && (
        <label className="text-sm text-grafito/70">
          {causal === "ORDEN_JUDICIAL" ? "N° de orden judicial" : "Detalle de la causal"}{" "}
          <span className="text-red-500">*</span>
          <input
            name="ordenNumero"
            required
            className="mt-1 w-full rounded-lg border border-grafito/15 px-3 py-2"
          />
        </label>
      )}
    </>
  );
}


export function LesionesField() {
  const [sinLesiones, setSinLesiones] = useState(false);

  return (
    <div className="grid gap-3">
      <label className="flex items-center gap-2 text-sm text-grafito/80">
        <input
          type="checkbox"
          name="sinLesionesAparentes"
          checked={sinLesiones}
          onChange={(e) => setSinLesiones(e.target.checked)}
        />
        No presenta lesiones aparentes al momento del control
      </label>
      {!sinLesiones && (
        <label className="text-sm text-grafito/70">
          Lugar y resultado de constatación de lesiones
          <input
            name="lesionesDetalle"
            className="mt-1 w-full rounded-lg border border-grafito/15 px-3 py-2"
            placeholder="Ej: Servicio de Salud ___, sin observaciones relevantes"
          />
        </label>
      )}
    </div>
  );
}
