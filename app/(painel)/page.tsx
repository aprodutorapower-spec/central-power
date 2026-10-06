import { redirect } from "next/navigation";
import { obterSessao } from "@/lib/sessao";
import { VisaoGeral } from "./visao-geral";

// Admin cai na visão geral; estrategista vai direto para os próprios experts.
export default async function InicioPage({ searchParams }: PageProps<"/">) {
  const { perfil } = await obterSessao();
  if (!perfil) redirect("/login");
  if (perfil.papel !== "admin") redirect("/experts");

  const parametros = await searchParams;
  const texto = (chave: string) => {
    const valor = parametros[chave];
    return typeof valor === "string" ? valor : undefined;
  };

  return (
    <VisaoGeral
      filtros={{
        modo: texto("modo"),
        estrategista: texto("estrategista"),
        status: texto("status"),
        tipo: texto("tipo"),
      }}
    />
  );
}
