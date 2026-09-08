"use client";

import { signIn } from "next-auth/react";
import { Scale, MessageCircle, HelpCircle, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function ingresarConRut(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCargando(true);
    window.sessionStorage.setItem("sesion-discord-activa", "1");
    const resultado = await signIn("credentials", { rut, password, callbackUrl: "/dashboard", redirect: false });
    if (resultado?.error) {
      setCargando(false);
      setError("RUT o contraseña incorrectos, o la cuenta no está activa.");
      return;
    }
    window.location.href = resultado?.url || "/dashboard";
  }

  return (
    <main className="min-h-screen bg-[#eeeeee] text-[#3d3d3d]">
      <header className="h-32 bg-gradient-to-r from-[#1377b8] via-[#2c91cb] to-[#0d6cae] px-6 md:px-[15%] flex items-center text-white">
        <div className="flex items-center gap-3">
          <div className="font-mono text-2xl tracking-[0.35em]">mi.</div>
          <div className="text-3xl font-bold tracking-tight">FISCALÍA</div>
          <div className="font-mono text-lg tracking-[0.3em] text-white/90">/ en línea</div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-11">
        <div className="mb-6 bg-white py-3 text-center text-sm font-semibold text-[#1880bd] shadow-sm">Ingreso</div>
        <section className="grid min-h-[345px] items-center gap-10 bg-white p-8 shadow-sm md:grid-cols-2 md:px-12">
          <div className="flex flex-col items-center justify-center text-center text-[#72add0]">
            <div className="mb-4 flex items-center gap-2 opacity-80"><Scale size={32} /><span className="font-mono text-xl tracking-[0.3em]">mi. FISCALÍA / en línea</span></div>
            <p className="text-sm">Fiscalía de Chile cada día más cerca de usted</p>
          </div>
          <div className="border-l-0 md:border-l md:border-[#dddddd] md:pl-10">
            <p className="mb-2 text-sm font-medium">RUT de usuario</p>
            <form onSubmit={ingresarConRut} className="grid gap-3">
              <input value={rut} onChange={(event) => setRut(event.target.value)} required placeholder="12345678-9" className="rounded border border-[#333] px-3 py-2 text-sm" />
              <input value={password} onChange={(event) => setPassword(event.target.value)} required type="password" placeholder="Contraseña" className="rounded border border-[#333] px-3 py-2 text-sm" />
              <button disabled={cargando} className="rounded border border-[#1377b8] bg-[#1377b8] px-4 py-3 font-semibold text-white hover:bg-[#0d6cae] disabled:opacity-60">{cargando ? "Ingresando..." : "Ingresar con RUT y contraseña"}</button>
            </form>
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            <div className="my-4 flex items-center gap-3 text-xs text-[#999]"><span className="h-px flex-1 bg-[#ddd]" />o<span className="h-px flex-1 bg-[#ddd]" /></div>
            <button
              onClick={() => {
                window.sessionStorage.setItem("sesion-discord-activa", "1");
                void signIn("discord", { callbackUrl: "/dashboard" });
              }}
              className="flex w-full items-center justify-center gap-2 rounded border border-[#5865F2] bg-[#5865F2] px-4 py-3 font-semibold text-white hover:bg-[#4752c4]"
            >
              <MessageCircle size={18} /> Ingresar con Discord
            </button>
            <p className="mt-2 text-right text-xs text-[#888]">Tu RUT se registra al completar el perfil.</p>
            <div className="my-6 border-t border-[#dddddd]" />
            <p className="text-xs leading-5 text-[#777]">Las cuentas nuevas o sin datos actualizados serán enviadas al perfil institucional antes de continuar.</p>
          </div>
        </section>
        <div className="mt-6 flex items-center justify-between bg-white px-4 py-5 text-sm text-[#888] shadow-sm">
          <span className="flex items-center gap-2"><HelpCircle size={18} /> Preguntas frecuentes</span>
          <span className="flex items-center gap-2"><ShieldCheck size={18} /> Acceso seguro mediante Discord</span>
        </div>
      </div>
    </main>
  );
}
