import { PrismaAdapter } from "@auth/prisma-adapter";
import { type NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
      // Pide el guild.members.read si más adelante quieres sincronizar roles del servidor de Discord
      authorization: { params: { scope: "identify email" } },
    }),
  ],
  // Usamos JWT (no "database") para que el middleware pueda leer el rol
  // del usuario sin golpear la base de datos en cada request.
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = (user as any).rol;
      } else if (token?.id) {
        // Refresca el rol en cada login/renovación de token por si un admin lo cambió
        const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } });
        if (dbUser) token.rol = dbUser.rol;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).rol = token.rol;
      }
      return session;
    },
  },
};
