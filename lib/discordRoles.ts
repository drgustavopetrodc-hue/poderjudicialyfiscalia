import type { Rol } from "@prisma/client";






const MAPEO_ROLES: { discordRoleId: string; rol: Rol }[] = [
  { discordRoleId: "1470515579764084740", rol: "ADMIN" },
  { discordRoleId: "1535147294222188624", rol: "JUEZ" },
  { discordRoleId: "1535147633335603241", rol: "FISCAL" },
  { discordRoleId: "1535148462033870948", rol: "ABOGADO" },
  { discordRoleId: "1535148605999153192", rol: "ABOGADO" },
  
  { discordRoleId: "1535147888676700160", rol: "FUNCIONARIO" },
  { discordRoleId: "1535148252205289542", rol: "FUNCIONARIO" },
  { discordRoleId: "1535148366256668702", rol: "CIUDADANO" },
];

const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID as string;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN as string;


export async function obtenerRolDesdeDiscord(discordUserId: string): Promise<Rol | null> {
  if (!DISCORD_GUILD_ID || !DISCORD_BOT_TOKEN) {
    console.warn("DISCORD_GUILD_ID o DISCORD_BOT_TOKEN no configurados; se omite la sincronización de roles.");
    return null;
  }

  try {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}`,
      {
        headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
        
        cache: "no-store",
      }
    );

    if (!res.ok) {
      
      console.warn(`No se pudo obtener el miembro de Discord (status ${res.status})`);
      return null;
    }

    const member = (await res.json()) as { roles: string[] };
    const rolesDelUsuario = new Set(member.roles);

    for (const { discordRoleId, rol } of MAPEO_ROLES) {
      if (rolesDelUsuario.has(discordRoleId)) return rol;
    }

    return null;
  } catch (err) {
    console.error("Error consultando la API de Discord:", err);
    return null;
  }
}
