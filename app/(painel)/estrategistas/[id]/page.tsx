import { notFound, redirect } from "next/navigation";
import { obterSessao } from "@/lib/sessao";
import { carregarPainel } from "../../dados-painel";
import { BotaoVoltar } from "../../interacoes";
import { SeloFaixa } from "../../lancamentos/painel-metas";
import { VisaoDoEstrategista } from "../../visao-estrategista";
import { Defasagem } from "../../visao-geral";

// Visão do estrategista (admin): todos os lançamentos ativos dele numa tela só.
export default async function EstrategistaPage({
  params,
}: PageProps<"/estrategistas/[id]">) {
  const { id } = await params;
  const { perfil } = await obterSessao();
  if (!perfil) redirect("/login");
  if (perfil.papel !== "admin") redirect("/");

  const { hoje, estrategistas } = await carregarPainel();
  const grupo = estrategistas.find((e) => (e.id ?? "sem-responsavel") === id);
  if (!grupo) notFound();
  const { resumo } = grupo;

  return (
    <>
      <BotaoVoltar href="/">← Visão geral</BotaoVoltar>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="flex flex-wrap items-baseline gap-x-3 text-2xl font-semibold">
          {grupo.nome}
          {resumo.faixa ? <SeloFaixa faixa={resumo.faixa} className="text-base" /> : null}
        </h1>
        <Defasagem resumo={resumo} />
      </div>
      <p className="mt-1 text-apagado">{resumo.motivo}.</p>

      <VisaoDoEstrategista grupo={grupo} hoje={hoje} quem={perfil.nome} admin />
    </>
  );
}
