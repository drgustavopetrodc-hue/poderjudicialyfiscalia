import { PrismaAdapter } from "@auth/prisma-adapter";
import { type NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { obtenerRolDesdeDiscord } from "./discordRoles";
import { esPresidenteCorteSuprema, esFiscalRegional, generarNifFiscal, normalizarRut } from "./identidad";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
      authorization: { params: { scope: "identify email" } },
    }),
    CredentialsProvider({
      name: "RUT y contraseña",
      credentials: {
        rut: { label: "RUT", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const rut = credentials?.rut ? normalizarRut(credentials.rut) : "";
        const password = credentials?.password ?? "";
        if (!rut || !password) return null;

        const usuario = await prisma.user.findUnique({
          where: { rut },
          select: { id: true, name: true, email: true, image: true, rol: true, activo: true, passwordHash: true },
        });
        if (!usuario?.passwordHash || !usuario.activo) return null;
        if (!(await bcrypt.compare(password, usuario.passwordHash))) return null;

        return {
          id: usuario.id,
          name: usuario.name,
          email: usuario.email,
          image: usuario.image,
          rol: usuario.rol,
        };
      },
    }),
  ],
  // Usamos JWT (no "database") para que el middleware pueda leer el rol
  // del usuario sin golpear la base de datos en cada request.
  session: { strategy: "jwt" },
  pages: {
    signIn: "/ovj",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.rol = (user as any).rol;
      }

      if (token.id) {
        const perfil = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { nombreIC: true, rut: true, passwordHash: true },
        });
        token.perfilCompleto = Boolean(perfil?.nombreIC?.trim() && perfil?.rut?.trim());
        token.passwordConfigurada = Boolean(perfil?.passwordHash);
      }

      // account solo viene presente justo en el login inicial (no en refresh)
      if (account?.provider === "discord" && account.providerAccountId) {
        token.discordId = account.providerAccountId;
        // Guardamos el discordId en la BD para poder re-sincronizar más adelante
        // (ej. desde un cron job) sin depender de que el usuario tenga sesión activa.
        await prisma.user.update({
          where: { id: token.id as string },
          data: { discordId: account.providerAccountId },
        });
      } else if (!token.discordId && token?.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } });
        if (dbUser?.discordId) token.discordId = dbUser.discordId;
      }

      // Sincroniza el rol real desde los roles del servidor de Discord.
      if (token.discordId) {
        const rolDesdeDiscord = await obtenerRolDesdeDiscord(token.discordId as string);
        if (rolDesdeDiscord) {
          token.rol = rolDesdeDiscord;
          await prisma.user.update({
            where: { id: token.id as string },
            data: { rol: rolDesdeDiscord },
          });
        } else if (!user && token?.id) {
          // No se pudo determinar por Discord (bot no configurado, usuario
          // salió del server, etc.) — usa el rol que ya tenga guardado en la BD.
          const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } });
          if (dbUser) token.rol = dbUser.rol;
        }

        // El Presidente de la Corte Suprema siempre tiene rango ADMIN,
        // sin importar lo que diga la sincronización de roles de Discord.
        if (esPresidenteCorteSuprema(token.discordId as string) && token.rol !== "ADMIN") {
          token.rol = "ADMIN";
          await prisma.user.update({ where: { id: token.id as string }, data: { rol: "ADMIN" } });
        }

        // El Fiscal Regional siempre tiene rango FISCAL, sin importar lo que diga
        // la sincronización de roles de Discord (cargo exclusivo, no un rol nuevo).
        if (esFiscalRegional(token.discordId as string) && token.rol !== "FISCAL") {
          token.rol = "FISCAL";
          await prisma.user.update({ where: { id: token.id as string }, data: { rol: "FISCAL" } });
        }

        // Si el usuario ya es fiscal, genera un NIF único si todavía no lo tiene.
        if (token.rol === "FISCAL" && token.id) {
          const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } });
          if (dbUser && !dbUser.nif) {
            await prisma.user.update({
              where: { id: token.id as string },
              data: { nif: generarNifFiscal(token.id as string) },
            });
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).rol = token.rol;
        (session.user as any).discordId = token.discordId;
        (session.user as any).perfilCompleto = token.perfilCompleto;
        (session.user as any).passwordConfigurada = token.passwordConfigurada;
      }
      return session;
    },
  },
};