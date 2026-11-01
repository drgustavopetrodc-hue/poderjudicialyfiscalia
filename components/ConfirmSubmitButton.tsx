"use client";
import React from "react";

export default function ConfirmSubmitButton({ formId, label, message = "¿Confirmas crear la causa?" }: { formId: string; label?: string; message?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        try {
          
          if (window.confirm(message)) {
            const form = document.getElementById(formId) as HTMLFormElement | null;
            if (!form) return;
            
            if (typeof (form as any).requestSubmit === "function") {
              (form as any).requestSubmit();
              return;
            }
            
            const submitBtn = form.querySelector('button[type=submit], input[type=submit]') as HTMLElement | null;
            if (submitBtn) {
              submitBtn.click();
              return;
            }
            
            form.submit();
            return;
          }
        } catch (e) {
          
          try {
            const form = document.getElementById(formId) as HTMLFormElement | null;
            form?.submit();
          } catch (err) {
            
            
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
