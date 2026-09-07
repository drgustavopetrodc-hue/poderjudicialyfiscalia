import { createHmac, timingSafeEqual } from "crypto";

function secretoCredencial(): string {
  const secreto = process.env.NEXTAUTH_SECRET;
  if (!secreto) throw new Error("NEXTAUTH_SECRET no está configurado");
  return secreto;
}

export function firmarCredencial(userId: string): string {
  return createHmac("sha256", secretoCredencial()).update(`credencial:${userId}`).digest("base64url");
}

export function credencialValida(userId: string, firma: string): boolean {
  try {
    const esperada = Buffer.from(firmarCredencial(userId));
    const recibida = Buffer.from(firma);
    return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
  } catch {
    return false;
  }
}
