"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MessageCircle, LockKeyhole, ArrowLeft } from "lucide-react";
import { FormEvent, useState } from "react";

export default function IngresoCausasPage() {
  const router = useRouter();
  const callbackUrl = "/consulta";

  function discord() {
    window.sessionStorage.setItem("sesion-discord-activa", "1");
    void signIn("discord", { callbackUrl });
  }

  const [claveAbierta, setClaveAbierta] = useState(false);
  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

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

  return (
    <main className="min-h-screen bg-[#eaf4fb] text-white">
      <header className="bg-[#06466b] px-6 py-5 md:px-[12%]"><button onClick={() => router.push("/")} className="flex items-center gap-2 text-sm text-white/80 hover:text-white"><ArrowLeft size={16} /> Volver</button></header>
      <section className="flex min-h-[calc(100vh-70px)] items-center justify-center bg-[url('https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=2200&q=85')] bg-cover bg-center px-5 py-12">
        <div className="w-full max-w-2xl rounded-2xl bg-[#125477]/90 p-8 shadow-2xl backdrop-blur-sm md:p-12">
          <h1 className="text-center text-3xl font-extrabold md:text-5xl">Ingreso de causas y escritos</h1>
          <div className="my-7 h-px bg-white/80" />
          <h2 className="text-center text-xl font-bold">Ingreso de demandas y escritos</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <button onClick={discord} className="flex items-center justify-center gap-2 rounded-xl bg-[#5865f2] px-5 py-3 font-bold"><MessageCircle size={19} /> Discord</button>
            <button onClick={() => setClaveAbierta((value) => !value)} className="flex items-center justify-center gap-2 rounded-xl bg-[#df3d62] px-5 py-3 font-bold"><LockKeyhole size={19} /> Clave Única</button>
          </div>
          {claveAbierta && (
            <div className="mx-auto mt-7 max-w-sm rounded-2xl bg-[#0b4d73] p-7 shadow-2xl">
              <h2 className="text-center text-3xl font-extrabold leading-tight">Acceso<br />Clave Poder Judicial</h2>
              <form onSubmit={ingresarConClave} className="mt-7 grid gap-4">
                <label className="text-sm font-bold">Ingresa RUT <span className="font-normal">(sin guión ni dígito verificador)</span><input value={rut} onChange={(event) => setRut(event.target.value)} required placeholder="Ej: 12345678" className="mt-2 w-full rounded px-3 py-3 text-[#333] outline-none" /></label>
                <label className="text-sm font-bold">Contraseña(*)<input value={password} onChange={(event) => setPassword(event.target.value)} required type="password" className="mt-2 w-full rounded px-3 py-3 text-[#333] outline-none" /></label>
                {error && <p className="text-sm text-red-200">{error}</p>}
                <button disabled={cargando} className="mt-2 rounded-xl bg-[#d54462] px-5 py-3 text-lg font-bold disabled:opacity-60">{cargando ? "Ingresando..." : "Ingresar"}</button>
              </form>
            </div>
          )}
          <p className="mt-8 border-t border-white/70 pt-6 text-sm leading-6 text-white/85">Desde aquí puedes acceder al ingreso de causas y escritos del sistema. Después de autenticarte llegarás al menú de consulta y gestión correspondiente a tu rol.</p>
        </div>
      </section>
    </main>
  );
}
