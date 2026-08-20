"use client";

import { signIn } from "next-auth/react";
import { Scale, MessageCircle } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-marino-950 text-hueso flex items-center justify-center px-6 relative overflow-hidden">
      <div className="sello absolute inset-0 pointer-events-none" />
      <div className="grid-ornamento absolute inset-0 pointer-events-none opacity-30" />

      <div className="relative max-w-sm w-full text-center fade-up">
        <div className="w-14 h-14 rounded-full border border-dorado-400/40 flex items-center justify-center mx-auto mb-6 bg-hueso/[0.04]">
          <Scale size={24} className="text-dorado-400" strokeWidth={1.5} />
        </div>
        <p className="font-mono text-dorado-400 text-xs tracking-[0.3em] uppercase mb-4">
          Acceso al sistema
        </p>
        <h1 className="font-display text-3xl mb-8">Identifícate para continuar</h1>
        <button
          onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
          className="w-full flex items-center justify-center gap-2.5 bg-[#5865F2] hover:bg-[#4752c4] transition-all hover:-translate-y-0.5 text-white font-semibold py-3.5 rounded-lg shadow-[0_8px_24px_-8px_rgba(88,101,242,.6)]"
        >
          <MessageCircle size={18} />
          Ingresar con Discord
        </button>
        <p className="text-hueso/40 text-xs mt-6 leading-relaxed">
          Tu cuenta se vincula a tu usuario de Discord. Un administrador del
          servidor te asignará tu rol judicial (Juez, Fiscal, Abogado, etc.)
          después de tu primer ingreso.
        </p>
      </div>
    </main>
  );
}
