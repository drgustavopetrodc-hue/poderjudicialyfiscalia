"use client";

import { useState } from "react";


export function ToggleDetailField({
  checkboxName,
  checkboxLabel,
  detailName,
  detailLabel,
  defaultChecked = false,
  requireDetailWhenChecked = false,
  helperText,
  multiline = false,
}: {
  checkboxName: string;
  checkboxLabel: string;
  detailName: string;
  detailLabel: string;
  defaultChecked?: boolean;
  requireDetailWhenChecked?: boolean;
  helperText?: string;
  multiline?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="rounded-lg border border-grafito/10 p-3">
      <label className="flex items-start gap-2 text-sm text-grafito/80">
        <input
          type="checkbox"
          name={checkboxName}
          defaultChecked={defaultChecked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5"
        />
        <span>{checkboxLabel}</span>
      </label>
      {helperText && <p className="mt-1 pl-6 text-xs text-grafito/50">{helperText}</p>}
      {checked && (
        <label className="mt-2 block pl-6 text-sm text-grafito/70">
          {detailLabel}
          {requireDetailWhenChecked && <span className="text-red-500"> *</span>}
          {multiline ? (
            <textarea
              name={detailName}
              required={requireDetailWhenChecked}
              className="mt-1 min-h-16 w-full rounded-lg border border-grafito/15 px-3 py-2"
            />
          ) : (
            <input
              name={detailName}
              required={requireDetailWhenChecked}
              className="mt-1 w-full rounded-lg border border-grafito/15 px-3 py-2"
            />
          )}
        </label>
      )}
    </div>
  );
}


export function ToggleNote({
  checkboxName,
  checkboxLabel,
  note,
  defaultChecked = false,
}: {
  checkboxName: string;
  checkboxLabel: string;
  note: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="rounded-lg border border-grafito/10 p-3">
      <label className="flex items-start gap-2 text-sm text-grafito/80">
        <input
          type="checkbox"
          name={checkboxName}
          defaultChecked={defaultChecked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5"
        />
        <span>{checkboxLabel}</span>
      </label>
      {checked && (
        <p className="mt-2 rounded-md bg-amber-50 p-2 pl-3 text-xs text-amber-800">{note}</p>
      )}
    </div>
  );
}
