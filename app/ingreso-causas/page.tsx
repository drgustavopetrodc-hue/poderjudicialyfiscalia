import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

// La mesa de partes existente contiene el formulario real de demandas y escritos.
// Esta ruta conserva el nombre de la OJV y nunca expone el formulario sin sesión.
export default async function IngresoCausasPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/ingreso-causas");
  redirect("/escritos");
}
