import { getServerSession } from "next-auth";
import { ImageResponse } from "next/og";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import {
  ROLES_FUNCIONARIOS,
  formatearRut,
  esPresidenteCorteSuprema,
  esFiscalRegional,
} from "@/lib/identidad";
import { obtenerAvatarRobloxDataUri } from "@/lib/roblox";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NOMBRE_ROL: Record<string, string> = {
  ADMIN: "Ministro de Corte Suprema",
  JUEZ: "Juez de la República",
  FISCAL: "Fiscal Adjunto",
  FUNCIONARIO: "Policía Judicial",
};

// El logo de Fiscalía original es un .svg — Satori (el motor de next/og) no
// soporta SVG embebido, así que lo pasamos por un conversor a PNG antes de
// descargarlo. El de Poder Judicial ya es .png, se usa directo.
const LOGO_PODER_JUDICIAL_URL = "https://upload.wikimedia.org/wikipedia/commons/0/05/Poderjudicial.png";
const LOGO_FISCALIA_URL =
  "https://wsrv.nl/?url=" +
  encodeURIComponent(
    "https://upload.wikimedia.org/wikipedia/commons/d/d7/Logotipo_Fiscal%C3%ADa_-_Ministerio_P%C3%BAblico_de_Chile.svg"
  ) +
  "&output=png&w=300";

/** Descarga una imagen y la convierte a data URI, para no depender de que Satori cargue URLs externas en vivo. */
async function obtenerImagenComoDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? "image/png";
    return `data:${contentType};base64,${bytes.toString("base64")}`;
  } catch (error) {
    console.warn("No se pudo obtener el logo institucional:", error);
    return null;
  }
}

const ANCHO_CREDENCIAL = 380;
const ALTO_CREDENCIAL = 800;

/** Hash determinístico simple (djb2/fnv-like) para sembrar los patrones de QR y código de barras. */
function semillaDesdeTexto(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** PRNG mulberry32: mismo texto de entrada -> siempre el mismo patrón visual para ese usuario. */
function generarRng(semilla: number) {
  let a = semilla;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Barras de ancho variable (decorativo, no un código real) para simular un código de verificación. */
function generarBarras(semillaTexto: string, cantidad = 26) {
  const rng = generarRng(semillaDesdeTexto(semillaTexto + "-barras"));
  return Array.from({ length: cantidad }, (_, i) => ({
    ancho: 1 + Math.floor(rng() * 3),
    oscura: i % 2 === 0,
  }));
}

function Credencial({
  nombreIC,
  rut,
  nif,
  cargo,
  rol,
  esPresidente,
  fotoDataUri,
  logoDataUri,
  qrDataUri,
}: {
  nombreIC: string;
  rut: string;
  nif?: string | null;
  cargo: string;
  rol: string;
  esPresidente: boolean;
  fotoDataUri?: string | null;
  logoDataUri?: string | null;
  qrDataUri: string;
}) {
  const esFiscalia = rol === "FISCAL";
  const colorPrimario = esFiscalia ? "#0f2e5c" : "#0a192f";
  const colorSecundario = esFiscalia ? "#174785" : "#112240";
  const colorDetalle = esFiscalia ? "#79b2fc" : "#b3924b";
  const tituloEntidad = esFiscalia ? "MINISTERIO PÚBLICO" : "PODER JUDICIAL";
  const subtituloEntidad = esFiscalia ? "FISCALÍA DE CHILE" : "REPÚBLICA DE CHILE";
  const siglasSello = esFiscalia ? "MP" : "PJUD";
  const colorTextoCargo = esFiscalia ? "#b91c1c" : "#0a192f";
  const fondoCargo = esFiscalia ? "#fde3e3" : "#dbe8f6";
  const textoFooter = esFiscalia ? "DOCUMENTO INTERNO" : "MINISTERIO DE JUSTICIA";

  const semilla = `${nombreIC}-${rut}`;
  const barras = generarBarras(semilla);
  const iniciales = (nombreIC || "?").trim().slice(0, 2).toUpperCase();

  return (
    <div
      style={{
        width: ANCHO_CREDENCIAL,
        height: ALTO_CREDENCIAL,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
        borderRadius: 22,
        overflow: "hidden",
        border: `3px solid ${colorPrimario}`,
        boxShadow: "0 18px 40px rgba(10,25,47,0.28)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Encabezado */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "22px 20px 26px",
          backgroundImage: `linear-gradient(180deg, ${colorPrimario} 0%, ${colorSecundario} 100%)`,
          borderBottom: `3px solid ${colorDetalle}`,
        }}
      >
        <div style={{ display: "flex", fontSize: 20, fontWeight: 800, color: "#ffffff", letterSpacing: 1 }}>
          {tituloEntidad}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 11,
            fontWeight: 700,
            color: colorDetalle,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          {subtituloEntidad}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 8,
            width: 52,
            height: 52,
            borderRadius: 999,
            backgroundColor: "#ffffff",
            border: `3px solid ${colorDetalle}`,
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
            overflow: "hidden",
          }}
        >
          {logoDataUri ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoDataUri} width={40} height={40} style={{ objectFit: "contain" }} />
          ) : (
            <div style={{ display: "flex", fontSize: 15, fontWeight: 800, color: colorPrimario }}>{siglasSello}</div>
          )}
        </div>
      </div>

      {/* Cuerpo */}
      <div style={{ display: "flex", flex: 1, flexDirection: "row" }}>
        <div style={{ display: "flex", width: 6, backgroundColor: colorDetalle }} />

        <div style={{ display: "flex", flex: 1, flexDirection: "column", padding: "24px 22px", gap: 20 }}>
          {/* Foto + nombre/rut */}
          <div style={{ display: "flex", flexDirection: "row", gap: 18, alignItems: "flex-start" }}>
            <div
              style={{
                display: "flex",
                width: 136,
                height: 136,
                borderRadius: 14,
                border: `2px solid ${colorPrimario}`,
                backgroundColor: "#f3f4f6",
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {fotoDataUri ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoDataUri} width={136} height={136} style={{ objectFit: "cover" }} />
              ) : (
                <div style={{ display: "flex", fontSize: 52, fontWeight: 800, color: colorPrimario }}>
                  {iniciales}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingTop: 4, gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", fontSize: 9, fontWeight: 800, color: "#6b7280", letterSpacing: 1 }}>
                  FUNCIONARIO / MAGISTRADO
                </div>
                <div style={{ display: "flex", fontSize: 18, fontWeight: 800, color: "#111827", lineHeight: 1.15 }}>
                  {nombreIC}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", fontSize: 9, fontWeight: 800, color: "#6b7280", letterSpacing: 1 }}>
                  RUN / RUT NACIONAL
                </div>
                <div style={{ display: "flex", fontSize: 16, fontWeight: 800, color: "#111827" }}>
                  {formatearRut(rut)}
                </div>
              </div>
              {esFiscalia && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", fontSize: 9, fontWeight: 800, color: "#6b7280", letterSpacing: 1 }}>
                    NIF FISCAL
                  </div>
                  <div style={{ display: "flex", fontSize: 15, fontWeight: 800, color: "#111827" }}>
                    {nif || "No asignado"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cargo */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              backgroundColor: fondoCargo,
              borderLeft: `4px solid ${colorDetalle}`,
              borderRadius: 8,
              padding: "10px 16px",
            }}
          >
            <div style={{ display: "flex", fontSize: 9, fontWeight: 800, color: "#6b7280", letterSpacing: 1 }}>
              CARGO INSTITUCIONAL
            </div>
            <div style={{ display: "flex", fontSize: 16, fontWeight: 800, color: colorTextoCargo }}>{cargo}</div>
          </div>

          {esFiscalia && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                padding: "8px 10px",
                border: "1px solid #bfdbfe",
                borderRadius: 6,
                backgroundColor: "#eff6ff",
                color: "#1e3a5f",
                fontSize: 10,
                fontWeight: 600,
                lineHeight: 1.35,
              }}
            >
              <div style={{ display: "flex" }}>
                El portador de la presente credencial es funcionario del Ministerio Público de Chile
              </div>
              <div style={{ display: "flex" }}>
                y está facultado para el ejercicio de las funciones que la ley le confiere.
              </div>
            </div>
          )}

          {(rol === "JUEZ" || esPresidente) && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                padding: "8px 10px",
                border: "1px solid #d8c28a",
                borderRadius: 6,
                backgroundColor: "#fffaf0",
                color: "#493b1d",
                fontSize: 11,
                fontWeight: 600,
                lineHeight: 1.35,
              }}
            >
              <div style={{ display: "flex" }}>
                El portador de la presente credencial es miembro oficial del Escalafón Primario del Poder Judicial de Chile.
              </div>
              <div style={{ display: "flex" }}>
                Se solicita a las autoridades civiles y policiales brindar las facilidades necesarias para el correcto desempeño de sus funciones jurisdiccionales.
              </div>
            </div>
          )}

          {(esFiscalia || rol === "JUEZ" || esPresidente) && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                paddingTop: 4,
                transform: "translateY(95px)",
                color: "#111827",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontFamily: "cursive",
                  fontSize: 20,
                  fontStyle: "italic",
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {esFiscalia ? "Frederick Borghese Dupond" : "Gabriel Boric Font"}
              </div>
              <div style={{ display: "flex", width: "72%", borderTop: "1px solid #374151", marginTop: 3 }} />
              <div style={{ display: "flex", marginTop: 3, fontSize: 8, fontWeight: 700, color: "#6b7280", letterSpacing: 0.8 }}>
                {esFiscalia ? "FISCAL REGIONAL" : "PRESIDENTE DE LA CORTE SUPREMA"}
              </div>
            </div>
          )}

          {/* QR + código de verificación */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: "auto",
              paddingTop: 10,
              transform: "translateY(-105px)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                padding: 4,
                backgroundColor: "#ffffff",
                border: `2px solid ${colorPrimario}`,
                borderRadius: 4,
              }}
            >
              {/* QR real: contiene la URL pública de verificación de la credencial. */}
              <img src={qrDataUri} width={81} height={81} style={{ objectFit: "contain" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
              <div style={{ display: "flex", fontSize: 8, fontWeight: 800, color: "#6b7280", letterSpacing: 1 }}>
                COD. VERIFICACIÓN
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  height: 34,
                  backgroundColor: "#ffffff",
                  border: `1px solid ${colorPrimario}`,
                  borderRadius: 2,
                  padding: "5px",
                }}
              >
                {barras.map((barra, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      width: barra.ancho,
                      height: 24,
                      backgroundColor: barra.oscura ? colorPrimario : "#ffffff",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pie */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          height: 40,
          padding: "0 20px",
          backgroundColor: colorPrimario,
          borderTop: `2px solid ${colorDetalle}`,
        }}
      >
        <div style={{ display: "flex", fontSize: 9, fontWeight: 700, color: colorDetalle, letterSpacing: 2 }}>
          ID-{siglasSello}-{iniciales}
        </div>
        <div style={{ display: "flex", fontSize: 9, fontWeight: 800, color: "#ffffff", letterSpacing: 1 }}>
          {textoFooter}
        </div>
      </div>
    </div>
  );
}

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

    const esPresidente = esPresidenteCorteSuprema(usuario.discordId);
    const esRegional = esFiscalRegional(usuario.discordId);
    const cargo = esPresidente
      ? "Presidente de la Corte Suprema"
      : esRegional && usuario.rol === "FISCAL"
        ? "Fiscal Regional"
        : NOMBRE_ROL[usuario.rol] ?? usuario.rol;

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
      console.warn("No se pudo mapear la imagen de perfil:", error);
      fotoFinal = null;
    }

    const filename = `credencial_${usuario.nombreIC.toLowerCase().replace(/\s+/g, "_")}.png`;
    const verificationUrl = `${new URL(req.url).origin}/verificar/credencial/${usuario.id}`;
    const qrDataUri = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 180,
      color: { dark: "#0a192f", light: "#ffffff" },
    });

    const logoUrl = usuario.rol === "FISCAL" ? LOGO_FISCALIA_URL : LOGO_PODER_JUDICIAL_URL;
    const logoFinal = await obtenerImagenComoDataUri(logoUrl);

    return new ImageResponse(
      (
        <Credencial
          nombreIC={usuario.nombreIC}
          rut={usuario.rut}
          nif={usuario.nif}
          cargo={cargo}
          rol={usuario.rol}
          esPresidente={esPresidente}
          fotoDataUri={fotoFinal}
          logoDataUri={logoFinal}
          qrDataUri={qrDataUri}
        />
      ),
      {
        width: ANCHO_CREDENCIAL,
        height: ALTO_CREDENCIAL,
        headers: {
          "Content-Disposition": `inline; filename="${filename}"`,
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error crítico en endpoint de carnet:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}