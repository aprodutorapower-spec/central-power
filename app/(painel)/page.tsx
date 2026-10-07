import { redirect } from "next/navigation";
import { obterSessao } from "@/lib/sessao";
import { VisaoGeral } from "./visao-geral";

// Admin cai na visão geral; estrategista vai direto para os próprios experts.
export default async function InicioPage() {
  const { perfil } = await obterSessao();
  if (!perfil) redirect("/login");
  if (perfil.papel !== "admin") redirect("/experts");

  return <VisaoGeral />;
}
