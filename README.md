# Poder Judicial RP

Sistema judicial para servidor de Discord de rol: registro de causas, certificación
de abogados, presentación de escritos, defensa técnica, audiencias y sentencias.

## Stack
- **Next.js 14** (App Router) — frontend + backend en un solo proyecto
- **Prisma + Postgres** — base de datos
- **NextAuth.js** — login con Discord OAuth
- **Tailwind CSS** — estilos

## 1. Base de datos
Crea una base Postgres gratis en [Neon](https://neon.tech) o [Vercel Postgres](https://vercel.com/storage/postgres).
Copia la connection string a `DATABASE_URL`.

## 2. Discord OAuth
1. Ve a https://discord.com/developers/applications → "New Application"
2. En "OAuth2 → General" copia **Client ID** y **Client Secret**
3. En "Redirects" agrega:
   - `http://localhost:3000/api/auth/callback/discord` (para desarrollo local)
   - `https://TU-DOMINIO.vercel.app/api/auth/callback/discord` (producción)

## 3. Variables de entorno
Copia `.env.example` a `.env` y completa los valores. Genera `NEXTAUTH_SECRET` con:
```bash
openssl rand -base64 32
```

## 4. Instalar y correr localmente
```bash
npm install
npx prisma db push   # crea las tablas en tu base de datos
npm run dev
```

## 5. Primer usuario administrador
Al iniciar sesión por primera vez con Discord, tu usuario se crea automáticamente
con el rol `CIUDADANO`. Para volverte `ADMIN` la primera vez, edita directamente
la base de datos (con `npx prisma studio`) y cambia tu `rol` a `ADMIN`. Desde ahí
podrás asignar roles a los demás usuarios desde `/dashboard/admin/usuarios`.

## 6. Desplegar en Vercel
1. Sube este proyecto a un repositorio de GitHub
2. Impórtalo en https://vercel.com/new
3. Agrega las mismas variables de entorno del `.env` en la configuración del proyecto en Vercel
4. Actualiza `NEXTAUTH_URL` al dominio final y el Redirect URI en Discord
5. Deploy 🎉

## Roles del sistema
- **ADMIN** — gestiona usuarios, roles y certificaciones
- **JUEZ** — ve sus causas asignadas, programa audiencias, dicta sentencias
- **FISCAL** — registra causas, presenta escritos, solicita audiencias
- **ABOGADO** — requiere certificación aprobada para asumir defensas
- **CIUDADANO** — rol por defecto; puede ser parte (imputado, víctima, etc.) en una causa

## Qué falta por construir (siguientes pasos sugeridos)
- Programar audiencias desde la UI (hoy el modelo existe, falta el formulario)
- Notificaciones (ej. por webhook a un canal de Discord cuando hay una nueva audiencia o sentencia)
- Subida de archivos para escritos (Vercel Blob)
- Historial de cambios de estado de una causa
