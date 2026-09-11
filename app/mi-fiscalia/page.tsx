import { redirect } from "next/navigation";

export default function MiFiscaliaPage() {
  redirect("/mi-fiscalia/denuncias?tab=presentar");
  return null;
}
