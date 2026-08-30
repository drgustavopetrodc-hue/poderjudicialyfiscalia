import { ImageResponse } from "next/og";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  ROLES_FUNCIONARIOS,
  INSTITUCION_POR_ROL,
  formatearRut,
  esPresidenteCorteSuprema,
  generarNifFiscal,
} from "@/lib/identidad";
import { obtenerAvatarRobloxDataUri } from "@/lib/roblox";

export const dynamic = "force-dynamic";

const NOMBRE_ROL: Record<string, string> = {
  ADMIN: "Ministro de Corte Suprema",
  JUEZ: "Juez",
  FISCAL: "Fiscal",
  FUNCIONARIO: "Funcionario",
};

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  const sessionUserId = (session?.user as any)?.id as string | undefined;
  const sessionRol = (session?.user as any)?.rol as string | undefined;

  // Solo el propio usuario o un admin pueden generar la identificación.
  if (!sessionUserId || (sessionUserId !== params.userId && sessionRol !== "ADMIN")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const usuario = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!usuario) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }
  if (!ROLES_FUNCIONARIOS.includes(usuario.rol)) {
    return NextResponse.json({ error: "Este rol no emite identificación institucional" }, { status: 400 });
  }
  if (!usuario.nombreIC || !usuario.rut) {
    return NextResponse.json({ error: "Faltan datos de identidad (nombre o RUT)" }, { status: 400 });
  }

  const institucion = usuario.institucion || INSTITUCION_POR_ROL[usuario.rol] || "Estado de Chile";
  const esPresidente = esPresidenteCorteSuprema(usuario.discordId);
  const cargo = esPresidente ? "Presidente de la Corte Suprema" : NOMBRE_ROL[usuario.rol] ?? usuario.rol;
  const nif = (usuario as any).nif || (usuario.rol === "FISCAL" ? generarNifFiscal(usuario.id) : null);

  // La foto sale del avatar de Roblox si el usuario lo registró en su perfil;
  // se descarga como datos embebidos (no una URL externa) para que el render
  // nunca dependa de una carga en vivo. Si falla o no hay usuario de Roblox,
  // se recurre al avatar de Discord; si tampoco hay, se usan iniciales.
  const fotoRoblox = usuario.robloxUsername
    ? await obtenerAvatarRobloxDataUri(usuario.robloxUsername)
    : null;

  // Si no hay foto de Roblox, convertimos `usuario.image` (URL externa) a
  // data URI para que `next/og` pueda incrustarla sin depender de fetches
  // remotos durante el renderizado. Si falla, queda en null y se usan iniciales.
  let fotoFinal: string | null = null;
  if (fotoRoblox) {
    fotoFinal = fotoRoblox;
  } else if (usuario.image) {
    try {
      const resImg = await fetch(usuario.image, { cache: "no-store" });
      if (resImg.ok) {
        const bytes = Buffer.from(await resImg.arrayBuffer());
        const contentType = resImg.headers.get("content-type") ?? "image/png";
        fotoFinal = `data:${contentType};base64,${bytes.toString("base64")}`;
      } else {
        fotoFinal = null;
      }
    } catch (err) {
      console.warn("No se pudo descargar el avatar externo:", err);
      fotoFinal = null;
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "640px",
          height: "1000px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1d1f22",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: "360px",
            height: "560px",
            background: "linear-gradient(180deg, #0f2444 0%, #153c6f 22%, #f5f7fa 22%, #f5f7fa 100%)",
            border: "3px solid #0f2444",
            borderRadius: "16px",
            overflow: "hidden",
            position: "relative",
            boxShadow: "0 16px 35px rgba(0,0,0,0.45)",
          }}
        >
          <div style={{ textAlign: "center", color: "#fff", paddingTop: "14px" }}>
            <div style={{ fontSize: 18, letterSpacing: 3, fontWeight: 800 }}>MINISTERIO PÚBLICO</div>
            <div style={{ marginTop: 6, fontSize: 11, letterSpacing: 2, color: "#9fc6ff", textTransform: "uppercase" }}>
              Fiscalía de Chile
            </div>
          </div>

          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 999,
              margin: "18px auto 14px",
              border: "2px solid #fff",
              background: "linear-gradient(135deg, #d7e8ff, #7aaef7)",
              color: "#0f2444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            MP
          </div>

          <div
            style={{
              width: 156,
              height: 180,
              margin: "0 auto",
              background: "linear-gradient(180deg, #dfe7f3, #c7d2e6)",
              border: "3px solid #0f2444",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              color: "#43546d",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {fotoFinal ? (
              <img
                src={fotoFinal}
                alt="Foto fiscal"
                width={156}
                height={180}
                style={{ width: 156, height: 180, objectFit: "cover" }}
              />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                {(usuario.nombreIC ?? "?").charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div style={{ padding: "18px 24px 0", color: "#1d2c42" }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "block", textTransform: "uppercase", fontSize: 9, letterSpacing: 1.4, color: "#6b7d95", marginBottom: 4 }}>
                Nombre funcionario
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f2444", lineHeight: 1.2, wordBreak: "break-word" }}>
                {usuario.nombreIC}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "block", textTransform: "uppercase", fontSize: 9, letterSpacing: 1.4, color: "#6b7d95", marginBottom: 4 }}>
                RUT institucional
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f2444", lineHeight: 1.2 }}>
                {formatearRut(usuario.rut)}
              </div>
            </div>

            {nif && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "block", textTransform: "uppercase", fontSize: 9, letterSpacing: 1.4, color: "#6b7d95", marginBottom: 4 }}>
                  NIF
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0f2444", lineHeight: 1.2 }}>
                  {nif}
                </div>
              </div>
            )}

            <div
              style={{
                background: "#edf4ff",
                borderLeft: "4px solid #153c6f",
                borderRadius: "8px",
                padding: "10px 12px",
                marginTop: 16,
              }}
            >
              <div style={{ display: "block", textTransform: "uppercase", fontSize: 9, letterSpacing: 1.4, color: "#6b7d95", marginBottom: 4 }}>
                Cargo oficial
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#b51f2a", lineHeight: 1.2 }}>
                {cargo.toUpperCase()}
              </div>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 40,
              background: "#0f2444",
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0 18px",
              fontSize: 9,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            <div style={{ color: "#dfeaff", letterSpacing: 3, fontWeight: 700 }}>|||| |||| ||||</div>
            <div>Documento interno</div>
          </div>
        </div>
      </div>
    ),
    { width: 640, height: 1000 }
  );
}
