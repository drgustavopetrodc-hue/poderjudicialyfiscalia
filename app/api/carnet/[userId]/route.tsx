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
} from "@/lib/identidad";
import { obtenerAvatarRoblox } from "@/lib/roblox";

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

  // La foto sale del avatar de Roblox si el usuario lo registró en su perfil;
  // si no, se recurre al avatar de Discord; si tampoco hay, se usan iniciales.
  const fotoUrl = usuario.robloxUsername
    ? await obtenerAvatarRoblox(usuario.robloxUsername)
    : null;
  const fotoFinal = fotoUrl ?? usuario.image ?? null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1012px",
          height: "638px",
          display: "flex",
          fontFamily: "Inter",
          background: "linear-gradient(135deg, #0b1526 0%, #16294a 60%, #0b1526 100%)",
          position: "relative",
        }}
      >
        {/* Franja dorada lateral */}
        <div style={{ position: "absolute", top: 0, left: 0, width: 14, height: "100%", background: "#c9a45c" }} />

        <div style={{ display: "flex", flexDirection: "column", width: "100%", padding: "48px 56px", color: "#f5f8fc" }}>
          {/* Cabecera */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 12, letterSpacing: 4, color: "#c9a45c", textTransform: "uppercase" }}>
                República de Chile
              </div>
              <div style={{ display: "flex", fontSize: 30, fontWeight: 700, marginTop: 6 }}>{institucion}</div>
              <div style={{ display: "flex", fontSize: 15, color: "rgba(245,248,252,0.55)", marginTop: 2 }}>
                Identificación institucional
              </div>
            </div>
            <div
              style={{
                display: "flex",
                width: 58,
                height: 58,
                borderRadius: 999,
                border: "2px solid rgba(201,164,92,0.6)",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
              }}
            >
              {esPresidente ? "♛" : "⚖"}
            </div>
          </div>

          {/* Cuerpo */}
          <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 40, marginTop: 30 }}>
            {fotoFinal ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fotoFinal}
                width={168}
                height={168}
                style={{ borderRadius: 16, border: "3px solid rgba(201,164,92,0.5)", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: 168,
                  height: 168,
                  borderRadius: 16,
                  border: "3px solid rgba(201,164,92,0.5)",
                  background: "rgba(245,248,252,0.06)",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 56,
                  fontWeight: 700,
                  color: "#c9a45c",
                }}
              >
                {(usuario.nombreIC ?? "?").charAt(0).toUpperCase()}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 12, color: "#c9a45c", letterSpacing: 2, textTransform: "uppercase" }}>Nombre</span>
                <span style={{ fontSize: 28, fontWeight: 700 }}>{usuario.nombreIC}</span>
              </div>
              <div style={{ display: "flex", gap: 60 }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 12, color: "#c9a45c", letterSpacing: 2, textTransform: "uppercase" }}>RUT</span>
                  <span style={{ fontSize: 20 }}>{formatearRut(usuario.rut)}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 12, color: "#c9a45c", letterSpacing: 2, textTransform: "uppercase" }}>Nacionalidad</span>
                  <span style={{ fontSize: 20 }}>{usuario.nacionalidad ?? "—"}</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 12, color: "#c9a45c", letterSpacing: 2, textTransform: "uppercase" }}>Cargo</span>
                <span style={{ fontSize: 20 }}>{cargo}</span>
              </div>
            </div>
          </div>

          {/* Pie */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid rgba(245,248,252,0.15)",
              paddingTop: 18,
              marginTop: 10,
            }}
          >
            <span style={{ fontSize: 12, color: "rgba(245,248,252,0.4)", letterSpacing: 1 }}>
              N° {usuario.id.slice(-8).toUpperCase()}
            </span>
            <span style={{ fontSize: 12, color: "rgba(245,248,252,0.4)", letterSpacing: 1 }}>
              Documento válido solo dentro del servidor de rol
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1012, height: 638 }
  );
}
