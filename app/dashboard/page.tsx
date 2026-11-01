import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";


export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol as string | undefined;
  if (!rol) redirect("/login");

  const destino: Record<string, string> = {
    ADMIN: "/causas",
    JUEZ: "/dashboard/juez",
    FISCAL: "/dashboard/fiscal",
    ABOGADO: "/dashboard/abogado",
    FUNCIONARIO: "/dashboard/funcionario",
    CIUDADANO: "/dashboard/parte",
  };
  redirect(destino[rol] ?? "/dashboard/parte");
}
