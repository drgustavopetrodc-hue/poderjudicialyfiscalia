"use client";
import React from "react";

export default function ConfirmSubmitButton({ formId, label, message = "¿Confirmas crear la causa?" }: { formId: string; label?: string; message?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        try {
          // eslint-disable-next-line no-alert
          if (window.confirm(message)) {
            const form = document.getElementById(formId) as HTMLFormElement | null;
            form?.requestSubmit?.();
          }
        } catch (e) {
          // fall back
          const form = document.getElementById(formId) as HTMLFormElement | null;
          form?.submit();
        }
      }}
      className="button-primary"
    >
      {label ?? "Crear causa"}
    </button>
  );
}
