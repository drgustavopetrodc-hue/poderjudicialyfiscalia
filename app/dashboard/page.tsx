import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";


export const dynamic = "force-dynamic";
const destinoPorRol: Record<string, string> = {
  ADMIN: "/dashboard/admin",
  JUEZ: "/dashboard/juez",
  FISCAL: "/dashboard/fiscal",
  ABOGADO: "/dashboard/abogado",
  FUNCIONARIO: "/dashboard/parte",
  CIUDADANO: "/dashboard/parte",
};

export default async function DashboardRoot() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const rol = (session.user as any)?.rol ?? "CIUDADANO";
  redirect(destinoPorRol[rol] ?? "/dashboard/parte");
}
