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
  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as any)?.id as string | undefined;
    const sessionRol = (session?.user as any)?.rol as string | undefined;

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

    let fotoFinal: string | null = null;
    try {
      const fotoRoblox = usuario.robloxUsername
        ? await obtenerAvatarRobloxDataUri(usuario.robloxUsername)
        : null;

      if (fotoRoblox) {
        fotoFinal = fotoRoblox;
      } else if (usuario.image) {
        const resImg = await fetch(usuario.image, { cache: "no-store" });
        if (resImg.ok) {
          const bytes = Buffer.from(await resImg.arrayBuffer());
          const contentType = resImg.headers.get("content-type") ?? "image/png";
          fotoFinal = `data:${contentType};base64,${bytes.toString("base64")}`;
        }
      }
    } catch (error) {
      console.warn("No se pudo resolver la foto del usuario:", error);
      fotoFinal = null;
    }

    const qrCells = Array.from({ length: 21 }, (_, y) =>
      Array.from({ length: 21 }, (_, x) => {
        const finderA = x < 7 && y < 7;
        const finderB = x > 13 && y < 7;
        const finderC = x < 7 && y > 13;
        const isFinder = finderA || finderB || finderC;
        const seed = (x * 17 + y * 11 + usuario.id.length * 3) % 13;
        const bit = isFinder ? true : (seed % 3 === 0 || ((x + y) % 5 === 0 && x > 9 && y > 7));
        return { x, y, bit };
      })
    ).flat();

    const barcodeBlocks = Array.from({ length: 40 }, (_, i) => {
      const active = i % 2 === 0 || (i % 7 === 0 && i > 10) || (i % 11 === 0 && i > 18);
      return { i, active };
    });

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#1f232b",
            fontFamily: "Arial, sans-serif",
            padding: "24px",
          }}
        >
          <div
            style={{
              width: "360px",
              height: "560px",
              background: "#edf2f5",
              borderRadius: "12px",
              overflow: "hidden",
              border: "2px solid #0f2444",
              boxShadow: "0 16px 30px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "120px",
                background: "linear-gradient(180deg, #0d2d4d 0%, #0d3d66 100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                color: "#fff",
                paddingTop: "12px",
                boxSizing: "border-box",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" }}>
                MINISTERIO PÚBLICO
              </div>
              <div style={{ marginTop: 4, fontSize: 11, color: "#dfeaff", letterSpacing: 1, textTransform: "uppercase" }}>
                {institucion}
              </div>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "#dfefff",
                  border: "2px solid #fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 14,
                  color: "#0f2444",
                  fontWeight: 900,
                  fontSize: 20,
                }}
              >
                MP
              </div>
            </div>

            <div
              style={{
                background: "#f3f6f9",
                height: "430px",
                padding: "20px 18px 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 188,
                  height: 188,
                  border: "3px solid #0f2444",
                  borderRadius: 8,
                  background: "#dfe7f3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  ...(fotoFinal
                    ? {
                        backgroundImage: `url(${fotoFinal})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : {}),
                }}
              >
                {!fotoFinal && (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 48,
                      fontWeight: 800,
                      color: "#0f2444",
                    }}
                  >
                    {(usuario.nombreIC || "?").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div style={{ width: "100%", display: "flex", marginTop: 18, alignItems: "flex-start" }}>
                <div style={{ flex: 1, paddingRight: 14 }}>
                  <div style={{ fontSize: 9, color: "#5d6b7a", letterSpacing: 1.8, textTransform: "uppercase", fontWeight: 800 }}>
                    Nombre funcionario
                  </div>
                  <div style={{ marginTop: 6, fontSize: 20, letterSpacing: 0.3, fontWeight: 800, color: "#0f2444", lineHeight: 1.3 }}>
                    {usuario.nombreIC}
                  </div>

                  <div style={{ marginTop: 14, fontSize: 9, color: "#5d6b7a", letterSpacing: 1.8, textTransform: "uppercase", fontWeight: 800 }}>
                    Rut institucional
                  </div>
                  <div style={{ marginTop: 6, fontSize: 18, fontWeight: 800, color: "#0f2444" }}>
                    {formatearRut(usuario.rut)}
                  </div>

                  {nif && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 9, color: "#5d6b7a", letterSpacing: 1.8, textTransform: "uppercase", fontWeight: 800 }}>
                        NIF
                      </div>
                      <div style={{ marginTop: 6, fontSize: 16, fontWeight: 800, color: "#0f2444" }}>{nif}</div>
                    </div>
                  )}
                </div>

                <div style={{ width: 72, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      background: "#fff",
                      border: "2px solid #0f2444",
                      padding: 3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div style={{ width: 58, height: 58, display: "flex", flexDirection: "column" }}>
                      {Array.from({ length: 21 }, (_, y) => (
                        <div key={y} style={{ display: "flex", flexDirection: "row", flex: 1 }}>
                          {qrCells
                            .filter((cell) => cell.y === y)
                            .map((cell) => (
                              <div
                                key={cell.x}
                                style={{ flex: 1, background: cell.bit ? "#111827" : "transparent" }}
                              />
                            ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: 10, width: 72, height: 24, background: "#fff", border: "1px solid #0f2444", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {barcodeBlocks.map((block) => (
                        <div
                          key={block.i}
                          style={{
                            width: 2,
                            height: 18,
                            background: block.active ? "#111827" : "transparent",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                height: 42,
                background: "#0f2444",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 14px",
                color: "#fff",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              <div style={{ color: "#dfeaff", letterSpacing: 3 }}>|||| |||| ||||</div>
              <div>Documento interno</div>
            </div>

            <div
              style={{
                background: "#dbe8f6",
                height: 72,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0f2444",
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              <div style={{ fontSize: 10, letterSpacing: 1.6, textTransform: "uppercase", color: "#5d6b7a", marginRight: 10 }}>
                Cargo oficial
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f2444" }}>{cargo}</div>
            </div>
          </div>
        </div>
      ),
      {
        width: 640,
        height: 1000,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error generando carnet:", error);
    return NextResponse.json(
      { error: "No se pudo generar la identificación institucional" },
      { status: 500 }
    );
  }
}