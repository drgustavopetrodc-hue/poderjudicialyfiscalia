"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-marino-950 text-hueso flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <p className="font-mono text-dorado-400 text-xs tracking-[0.3em] uppercase mb-4">
          Acceso al sistema
        </p>
        <h1 className="font-display text-3xl mb-8">Identifícate para continuar</h1>
        <button
          onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
          className="w-full bg-[#5865F2] hover:bg-[#4752c4] transition-colors text-white font-semibold py-3 rounded-sm"
        >
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
