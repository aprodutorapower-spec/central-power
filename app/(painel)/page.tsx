import { redirect } from "next/navigation";
import { resumir } from "@/lib/painel";
import { obterSessao } from "@/lib/sessao";
import { carregarPainel } from "./dados-painel";
import { SeloFaixa } from "./lancamentos/painel-metas";
import { VisaoDoEstrategista } from "./visao-estrategista";
import { VisaoGeral } from "./visao-geral";

// Admin cai na visão geral; o estrategista, nos próprios lançamentos (a mesma
// tela que o admin vê dele, sem o botão de cobrança).
export default async function InicioPage() {
  const { perfil } = await obterSessao();
  if (!perfil) redirect("/login");
  if (perfil.papel === "admin") return <VisaoGeral />;

  // O banco só devolve os lançamentos dos experts de quem está logado.
  const { hoje, itens } = await carregarPainel();
  const grupo = { id: perfil.id, nome: perfil.nome, itens, resumo: resumir(itens) };

  return (
    <>
      <h1 className="flex flex-wrap items-baseline gap-x-3 text-2xl font-semibold">
        Meus lançamentos
        {grupo.resumo.faixa ? (
          <SeloFaixa faixa={grupo.resumo.faixa} className="text-base" />
        ) : null}
      </h1>
      <p className="mt-1 text-apagado">{grupo.resumo.motivo}.</p>

      <VisaoDoEstrategista grupo={grupo} hoje={hoje} quem={perfil.nome} admin={false} />
    </>
  );
}
