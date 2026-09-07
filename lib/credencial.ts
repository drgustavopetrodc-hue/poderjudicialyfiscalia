import { createHmac, timingSafeEqual } from "crypto";

function secretoCredencial(): string {
  const secreto = process.env.NEXTAUTH_SECRET;
  if (!secreto) throw new Error("NEXTAUTH_SECRET no está configurado");
  return secreto;
}

export function firmarCredencial(userId: string, version = 1): string {
  return createHmac("sha256", secretoCredencial()).update(`credencial:${userId}:v${version}`).digest("base64url");
}

export function credencialValida(userId: string, firma: string, version = 1): boolean {
  try {
    const esperada = Buffer.from(firmarCredencial(userId, version));
    const recibida = Buffer.from(firma);
    return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
  } catch {
    return false;
  }
}
