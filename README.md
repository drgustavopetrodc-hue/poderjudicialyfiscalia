# Poder Judicial

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

Si actualizas desde una versión anterior, vuelve a ejecutar `npx prisma db push`
después de copiar el proyecto: esta versión agrega la tabla `OrdenCaptura`.

### Publicación automática en el foro de Discord

El bot puede crear un post automáticamente en el canal foro configurado y
adjuntar el PDF actualizado del expediente cuando se crea o modifica una causa.
El bot debe tener permisos de **View Channel**, **Create Posts**, **Send Messages**,
**Send Messages in Threads** y **Attach Files** en ese canal. Configura
`DISCORD_BOT_TOKEN` y ejecuta `npx prisma db push` para agregar el vínculo del
post de Discord a cada causa.

La fiscalía permite adjuntar imágenes de evidencia y oficios PDF de hasta 10 MB,
además de videos de hasta 5 GB mediante subida directa y multipart a Vercel Blob.
Los videos no pasan por la función de Next.js ni se guardan en Postgres: solo se
registra su URL en el expediente. El límite de video puede cambiarse con
`VIDEO_MAX_SIZE_GB` en las variables de entorno de Vercel. Estos antecedentes
aparecen en el expediente y se incluyen en el PDF actualizado.

## 5. Sincronización automática de roles con Discord
El sistema puede leer los roles reales del servidor de Discord y asignar el rol
correspondiente dentro de la app automáticamente, cada vez que alguien inicia sesión.

**Configurar el bot:**
1. En https://discord.com/developers/applications, entra a tu misma app (la del login).
2. Ve a la pestaña **"Bot"** → "Add Bot" (o "Reset Token" si ya existe uno) → copia el token.
3. Pégalo en `DISCORD_BOT_TOKEN` en tu `.env` (y en las variables de entorno de Vercel).
4. Ve a **"OAuth2 → URL Generator"**, marca el scope `bot`, y en permisos no necesitas
   marcar nada especial (con que el bot esté en el servidor alcanza). Copia la URL
   generada, ábrela, y agrega el bot a tu servidor de rol.
5. `DISCORD_GUILD_ID` ya viene configurado con el ID de tu servidor: `1470515579407302778`.

**Mapeo de roles configurado** (en `lib/discordRoles.ts`):

| Rol de Discord | Rol en el sistema |
|---|---|
| `1470515579764084740` | ADMIN |
| `1535147294222188624` | JUEZ |
| `1535147633335603241` | FISCAL |
| `1535148462033870948`, `1535148605999153192` | ABOGADO |
| `1535147888676700160` (Carabineros), `1535148252205289542` (PDI) | FUNCIONARIO |
| `1535148366256668702` | CIUDADANO |

Si alguien tiene varios de estos roles en Discord a la vez, gana el que aparece
primero en la tabla de arriba (ej. JUEZ le gana a CIUDADANO).

**Importante:** mientras el bot esté bien configurado, el rol se sincroniza en
cada login y **sobrescribe** cualquier cambio manual que hagas desde
`/dashboard/admin/usuarios`. Ese panel manual sigue sirviendo como respaldo
para cuando el bot no puede determinar un rol (ej. el usuario salió del server).

## 6. Primer usuario administrador
Antes de tener el bot configurado, o si prefieres hacerlo a mano la primera vez:
inicia sesión con Discord (tu usuario se crea con rol `CIUDADANO`), luego edita
directamente la base de datos (con `npx prisma studio`) y cambia tu `rol` a
`ADMIN`. Si ya tienes el bot configurado y el rol de Discord `ADMIN` asignado a
tu usuario, esto ya no es necesario — se sincroniza solo.

## 7. Desplegar en Vercel
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
