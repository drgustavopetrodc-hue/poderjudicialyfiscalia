/**
 * Resolución de avatar de Roblox en 2 pasos:
 *   1) username -> userId       (POST users.roblox.com/v1/usernames/users)
 *   2) userId   -> URL de foto  (GET thumbnails.roblox.com/v1/users/avatar-headshot)
 */

export class RobloxAvatarError extends Error {}

/** Paso 1: convierte un username de Roblox en su ID numérico. Lanza si no existe. */
async function obtenerUserIdRoblox(username: string): Promise<number> {
  const res = await fetch("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new RobloxAvatarError(`Roblox respondió ${res.status} al buscar el username "${username}".`);
  }

  const json = (await res.json()) as { data?: { id: number }[] };
  const id = json.data?.[0]?.id;

  if (!id) {
    throw new RobloxAvatarError(`No se encontró ningún usuario de Roblox con el nombre "${username}".`);
  }

  return id;
}

/** Paso 2: dado un ID numérico, obtiene la URL de su foto (headshot) en 420x420 PNG transparente. */
async function obtenerUrlAvatarRoblox(userId: number): Promise<string> {
  const res = await fetch(
    `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new RobloxAvatarError(`Roblox respondió ${res.status} al pedir la miniatura del usuario ${userId}.`);
  }

  const json = (await res.json()) as { data?: { imageUrl: string; state: string }[] };
  const entrada = json.data?.[0];

  if (!entrada || entrada.state !== "Completed") {
    throw new RobloxAvatarError(`La miniatura del usuario ${userId} no está lista (estado: ${entrada?.state ?? "desconocido"}).`);
  }

  return entrada.imageUrl;
}

/**
 * Función pública: username de Roblox -> URL de su avatar en 420x420 PNG transparente.
 * Encapsula los 2 pasos y cualquier error de red/API se propaga como RobloxAvatarError.
 */
export async function obtenerAvatarRobloxUrl(username: string): Promise<string> {
  try {
    const userId = await obtenerUserIdRoblox(username);
    return await obtenerUrlAvatarRoblox(userId);
  } catch (error) {
    if (error instanceof RobloxAvatarError) throw error;
    throw new RobloxAvatarError(`Fallo de red al consultar la API de Roblox: ${error}`);
  }
}

/**
 * Versión "lista para usar en next/og": resuelve el username, DESCARGA los bytes
 * reales de la imagen (no solo la URL) y los devuelve como data URI en base64.
 *
 * Esto es necesario porque el motor de renderizado de imágenes (Satori, usado por
 * next/og) a veces no logra cargar imágenes remotas de ciertos CDNs durante el
 * render — al incrustar los bytes directamente evitamos ese punto de falla.
 *
 * Devuelve null si algo falla en cualquier paso (usuario no existe, Roblox no
 * responde, etc.) para que quien llame pueda usar un respaldo sin romper la app.
 */
export async function obtenerAvatarRobloxDataUri(username: string): Promise<string | null> {
  try {
    const imageUrl = await obtenerAvatarRobloxUrl(username);

    const resImagen = await fetch(imageUrl, { cache: "no-store" });
    if (!resImagen.ok) {
      throw new RobloxAvatarError(`No se pudo descargar la imagen final (status ${resImagen.status}).`);
    }

    const bytes = Buffer.from(await resImagen.arrayBuffer());
    const contentType = resImagen.headers.get("content-type") ?? "image/png";
    return `data:${contentType};base64,${bytes.toString("base64")}`;
  } catch (error) {
    console.warn("No se pudo obtener el avatar de Roblox:", error);
    return null;
  }
}
