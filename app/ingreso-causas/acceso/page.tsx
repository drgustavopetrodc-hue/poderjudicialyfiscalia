"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { LockKeyhole, MessageCircle, Scale } from "lucide-react";

export default function AccesoIngresoCausasPage() {
  const router = useRouter();
  const { status } = useSession();
  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/ingreso-causas");
  }, [router, status]);

  if (status === "loading" || status === "authenticated") {
    return <main className="flex min-h-screen items-center justify-center bg-[#eef1f3] text-sm text-[#12486d]">Cargando acceso...</main>;
  }

  async function ingresarConRut(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCargando(true);
    const resultado = await signIn("credentials", {
      rut,
      password,
      callbackUrl: "/ingreso-causas",
      redirect: false,
    });
    if (resultado?.error) {
      setCargando(false);
      setError("RUT o contraseña incorrectos, o la cuenta no está activa.");
      return;
    }
    window.location.href = resultado?.url || "/ingreso-causas";
  }

  function ingresarConDiscord() {
    void signIn("discord", { callbackUrl: "/ingreso-causas" });
  }

  return (
    <main className="min-h-screen bg-[#eef1f3] text-white">
      <header className="flex h-[74px] items-center justify-between bg-[#06466b] px-6 md:px-[12%]">
        <a href="/ovj" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center border-2 border-white/80 text-xl"><Scale size={23} /></div>
          <div className="leading-none">
            <p className="text-[15px] font-semibold tracking-[0.15em]">PODER JUDICIAL</p>
            <p className="mt-1 text-[7px] tracking-[0.25em] text-white/75">REPÚBLICA DE CHILE</p>
          </div>
        </a>
      </header>

      <section className="relative min-h-[calc(100vh-74px)] overflow-hidden bg-[#071d2c] px-5 py-12">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=2200&q=85')] bg-cover bg-center opacity-55" />
        <div className="absolute inset-0 bg-[#061522]/60" />
        <div className="relative mx-auto max-w-xl rounded-2xl bg-[#145476]/90 p-7 shadow-2xl backdrop-blur-sm md:p-10">
          <h1 className="text-center text-2xl font-extrabold md:text-3xl">Ingreso de causas y escritos</h1>
          <div className="my-6 h-px bg-white/80" />
          <h2 className="text-center text-xl font-bold">Acceso a la Oficina Judicial Virtual</h2>
          <p className="mt-3 text-center text-sm text-white/80">Inicia sesión para ingresar demandas y escritos.</p>
          <form onSubmit={ingresarConRut} className="mt-6 grid gap-3">
            <label className="text-sm font-semibold">RUT<input value={rut} onChange={(event) => setRut(event.target.value)} required placeholder="12.345.678-9" className="mt-1 w-full rounded bg-white px-3 py-2.5 text-[#1b3445] outline-none" /></label>
            <label className="text-sm font-semibold">Contraseña<input value={password} onChange={(event) => setPassword(event.target.value)} required type="password" className="mt-1 w-full rounded bg-white px-3 py-2.5 text-[#1b3445] outline-none" /></label>
            {error && <p className="text-sm text-red-200">{error}</p>}
            <button disabled={cargando} className="mt-2 flex items-center justify-center gap-2 rounded bg-[#2ca9df] px-4 py-3 font-bold text-white hover:bg-[#1f93c5] disabled:opacity-60"><LockKeyhole size={17} />{cargando ? "Ingresando..." : "Ingresar con RUT y contraseña"}</button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-white/60"><span className="h-px flex-1 bg-white/40" />o<span className="h-px flex-1 bg-white/40" /></div>
          <button onClick={ingresarConDiscord} className="flex w-full items-center justify-center gap-2 rounded bg-[#5865f2] px-4 py-3 font-bold text-white hover:bg-[#4752c4]"><MessageCircle size={18} />Ingresar con Discord</button>
          <a href="/ovj" className="mt-5 block text-center text-sm text-white/75 underline">Volver al inicio</a>
        </div>
      </section>
    </main>
  );
}
