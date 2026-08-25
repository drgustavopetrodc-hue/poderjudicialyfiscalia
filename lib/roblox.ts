/**
 * Resuelve la foto de avatar (headshot) de un usuario de Roblox a partir de
 * su nombre de usuario, usando las APIs públicas de Roblox. Devuelve null si
 * el usuario no existe o si algo falla — quien llame debe tener un respaldo
 * (ej. el avatar de Discord, o iniciales).
 */
export async function obtenerAvatarRoblox(username: string): Promise<string | null> {
  const usuario = username.trim();
  if (!usuario) return null;

  try {
    // 1. Nombre de usuario → ID numérico de Roblox
    const resUsuario = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [usuario], excludeBannedUsers: true }),
      cache: "no-store",
    });
    if (!resUsuario.ok) return null;

    const dataUsuario = (await resUsuario.json()) as { data?: { id: number }[] };
    const robloxId = dataUsuario.data?.[0]?.id;
    if (!robloxId) return null;

    // 2. ID numérico → URL de la foto (headshot circular)
    const resAvatar = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=420x420&format=Png&isCircular=false`,
      { cache: "no-store" }
    );
    if (!resAvatar.ok) return null;

    const dataAvatar = (await resAvatar.json()) as { data?: { imageUrl: string; state: string }[] };
    const entrada = dataAvatar.data?.[0];
    if (!entrada || entrada.state !== "Completed") return null;

    return entrada.imageUrl;
  } catch (error) {
    console.warn("No se pudo obtener el avatar de Roblox:", error);
    return null;
  }
}
