"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ChevronDown, LockKeyhole, MessageCircle, Search, SearchCheck, X } from "lucide-react";

type PortalHomeProps = {
  callbackUrl?: string;
  authError?: string;
};

export default function PortalHome({ callbackUrl: callbackUrlParam, authError }: PortalHomeProps) {
  const router = useRouter();
  const [serviciosAbiertos, setServiciosAbiertos] = useState(Boolean(authError));
  const [accesoAbierto, setAccesoAbierto] = useState(false);
  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const callbackUrl = callbackUrlParam || "/consulta";
  const authErrorMessage = authError === "OAuthCallback"
    ? "No se pudo completar el acceso con Discord. Inténtalo de nuevo."
    : authError
      ? "Hubo un problema al iniciar sesión. Inténtalo de nuevo."
      : "";

  async function ingresarConClave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCargando(true);
    const resultado = await signIn("credentials", { rut, password, callbackUrl, redirect: false });
    if (resultado?.error) {
      setCargando(false);
      setError("RUT o contraseña incorrectos.");
      return;
    }
    router.push(resultado?.url || callbackUrl);
  }

  function ingresarConDiscord() {
    window.sessionStorage.setItem("sesion-discord-activa", "1");
    void signIn("discord", { callbackUrl });
  }

  return (
    <main className="min-h-screen bg-[#eef1f3] text-white">
      <header className="relative z-20 flex h-[74px] items-center justify-between bg-[#06466b] px-6 md:px-[12%]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center border-2 border-white/80 text-xl">⚖</div>
          <div className="leading-none">
            <p className="text-[15px] font-semibold tracking-[0.15em]">PODER JUDICIAL</p>
            <p className="mt-1 text-[7px] tracking-[0.25em] text-white/75">REPÚBLICA DE CHILE</p>
          </div>
        </div>
      </header>

      <section className="relative min-h-[calc(100vh-74px)] overflow-hidden bg-[#071d2c] px-5 py-16">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=2200&q=85')] bg-cover bg-center opacity-55" />
        <div className="absolute inset-0 bg-[#061522]/60" />
        <div className="relative mx-auto max-w-5xl">
          <h1 className="text-center text-3xl font-extrabold tracking-wide text-white drop-shadow md:text-5xl">OFICINA JUDICIAL VIRTUAL</h1>
          {authErrorMessage && <p role="alert" className="mx-auto mt-5 max-w-2xl rounded bg-red-950/70 px-4 py-3 text-center text-sm text-white">{authErrorMessage}</p>}
          <div className="mt-14 grid gap-12 md:grid-cols-3">
            <button onClick={() => setServiciosAbiertos((value) => !value)} className="portal-service border-l-4 border-[#d3df28]">Todos los servicios <ChevronDown size={18} className={serviciosAbiertos ? "rotate-180" : ""} /></button>
            <button onClick={() => router.push("/ingreso-causas/acceso")} className="portal-service border-l-4 border-[#d3df28]">Ingreso de causas y escritos</button>
            <button onClick={() => router.push("/consulta")} className="portal-service border-l-4 border-[#d3df28]"><Search size={18} /> Consulta causas</button>
            <button onClick={() => router.push("/consulta-ciudadana")} className="portal-service border-l-4 border-[#d3df28]"><SearchCheck size={18} /> Consulta funcionarios y abogados</button>
          </div>
          {serviciosAbiertos && (
            <div className="mx-auto mt-7 grid max-w-2xl gap-3 rounded-xl bg-black/35 p-4 backdrop-blur-sm md:grid-cols-2">
              <button onClick={ingresarConDiscord} className="portal-option bg-[#5865f2]"><MessageCircle size={18} /> Ingresar con Discord</button>
              <button onClick={() => setAccesoAbierto(true)} className="portal-option bg-[#147bb3]"><LockKeyhole size={18} /> Ingresar con Clave Única</button>
            </div>
          )}
        </div>
      </section>

      {accesoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true">
          <section className="w-full max-w-lg overflow-hidden rounded-lg bg-white text-[#333] shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-5"><h2 className="text-xl font-semibold">ACCESO A OFICINA JUDICIAL VIRTUAL</h2><button onClick={() => setAccesoAbierto(false)} aria-label="Cerrar"><X size={20} /></button></div>
            <div className="p-6">
              <p className="mb-5 text-sm text-[#666]">Ingresa con tu RUT y contraseña creada en el perfil institucional.</p>
              <form onSubmit={ingresarConClave} className="grid gap-3">
                <label className="text-sm font-medium">RUT<input value={rut} onChange={(event) => setRut(event.target.value)} required placeholder="Ingrese su RUT" className="mt-1 w-full border-b border-[#777] px-2 py-3 outline-none" /></label>
                <label className="text-sm font-medium">Contraseña<input value={password} onChange={(event) => setPassword(event.target.value)} required type="password" placeholder="Ingrese su contraseña" className="mt-1 w-full border-b border-[#777] px-2 py-3 outline-none" /></label>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button disabled={cargando} className="mt-3 justify-self-end rounded bg-[#1d72af] px-5 py-2.5 font-semibold text-white disabled:opacity-60">{cargando ? "Ingresando..." : "Ingresar"}</button>
              </form>
              <div className="my-5 flex items-center gap-3 text-xs text-[#999]"><span className="h-px flex-1 bg-[#ddd]" />o<span className="h-px flex-1 bg-[#ddd]" /></div>
              <button onClick={ingresarConDiscord} className="flex w-full items-center justify-center gap-2 rounded bg-[#5865f2] px-4 py-3 font-semibold text-white"><MessageCircle size={18} /> Ingresar con Discord</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
