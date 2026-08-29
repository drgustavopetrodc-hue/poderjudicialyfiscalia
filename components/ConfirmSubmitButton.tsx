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
            if (!form) return;
            // Prefer requestSubmit when available (preserves validation)
            if (typeof (form as any).requestSubmit === "function") {
              (form as any).requestSubmit();
              return;
            }
            // Fallback: try to find a visible submit button and click it
            const submitBtn = form.querySelector('button[type=submit], input[type=submit]') as HTMLElement | null;
            if (submitBtn) {
              submitBtn.click();
              return;
            }
            // Last resort: use form.submit()
            form.submit();
            return;
          }
        } catch (e) {
          // fall back: try to submit anyway
          try {
            const form = document.getElementById(formId) as HTMLFormElement | null;
            form?.submit();
          } catch (err) {
            // ensure error visible in console
            // eslint-disable-next-line no-console
            console.error('ConfirmSubmitButton error', err);
          }
        }
      }}
      className="button-primary"
    >
      {label ?? "Crear causa"}
    </button>
  );
}
