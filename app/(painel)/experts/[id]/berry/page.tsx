import Link from "next/link";
import { notFound } from "next/navigation";
import { BotaoEnviar } from "@/app/botao-enviar";
import {
  chaveDoExpert,
  contarVendasPagas,
  ErroBerry,
  listarProdutos,
  type ProdutoBerry,
} from "@/lib/berry";
import { diaDe, formatarData } from "@/lib/datas";
import { formatarInteiro } from "@/lib/numeros";
import { obterSessao } from "@/lib/sessao";
import { desconectarBerry } from "./actions";
import { FormChave, SeletorProduto } from "./form-berry";

type Conexao = {
  chave_final: string;
  conectado_por_nome: string | null;
  conectado_em: string;
};

type LancamentoBerry = {
  id: string;
  nome: string;
  situacao: "ativo" | "encerrado";
  dv0: string | null;
  berry_produto_id: string | null;
};

export default async function BerryPage({
  params,
}: PageProps<"/experts/[id]/berry">) {
  const { id } = await params;
  const { supabase } = await obterSessao();

  const [{ data: expert }, { data: dadosConexao }, { data: lista }] =
    await Promise.all([
      supabase.from("experts").select("id, nome").eq("id", id).maybeSingle(),
      supabase
        .from("berry_conexoes")
        .select("chave_final, conectado_por_nome, conectado_em")
        .eq("expert_id", id)
        .maybeSingle(),
      supabase
        .from("lancamentos")
        .select("id, nome, situacao, dv0, berry_produto_id")
        .eq("expert_id", id)
        .order("situacao")
        .order("d0"),
    ]);
  // Expert de outro estrategista não é devolvido pelo banco: vira "não encontrado".
  if (!expert) notFound();

  const conexao = dadosConexao as Conexao | null;
  const lancamentos = (lista ?? []) as LancamentoBerry[];

  let produtos: ProdutoBerry[] = [];
  let falha: string | null = null;
  const vendas = new Map<string, number>();

  if (conexao) {
    try {
      const chave = await chaveDoExpert(id);
      if (!chave) throw new ErroBerry("Chave não encontrada. Conecte de novo.");
      produtos = await listarProdutos(chave);

      const comProduto = lancamentos.filter((l) => l.berry_produto_id);
      const totais = await Promise.all(
        comProduto.map((l) => contarVendasPagas(chave, l.berry_produto_id!, l.dv0)),
      );
      comProduto.forEach((l, i) => vendas.set(l.id, totais[i]));
    } catch (erro) {
      falha =
        erro instanceof ErroBerry
          ? erro.message
          : "Não foi possível consultar a Berry agora.";
    }
  }

  return (
    <>
      <Link
        href={`/experts/${expert.id}`}
        className="text-sm text-apagado hover:text-texto"
      >
        ← {expert.nome}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Conexão com a Berry</h1>

      <section className="mt-6 max-w-2xl rounded-xl border border-borda bg-cartao p-5">
        {conexao ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-semibold">
                <span
                  className={`h-3 w-3 rounded-full ${falha ? "bg-power-claro" : "bg-ok"}`}
                />
                {falha ? "Conexão com problema" : "Conta conectada"}
              </h2>
              <span className="text-sm text-apagado">
                Chave terminada em{" "}
                <span className="font-mono">{conexao.chave_final}</span>
              </span>
            </div>
            <p className="mt-1 text-sm text-apagado">
              Conectada
              {conexao.conectado_por_nome ? ` por ${conexao.conectado_por_nome}` : ""}{" "}
              em {formatarData(diaDe(conexao.conectado_em))}.
            </p>
            {falha ? (
              <p className="mt-3 text-sm text-power-claro" role="alert">
                {falha}
              </p>
            ) : null}

            <details className="mt-4 border-t border-borda pt-4" open={Boolean(falha)}>
              <summary className="cursor-pointer text-sm text-apagado hover:text-texto">
                Trocar a chave ou desconectar
              </summary>
              <div className="mt-3">
                <FormChave expertId={expert.id} trocando />
              </div>
              <form action={desconectarBerry} className="mt-4">
                <input type="hidden" name="expert_id" value={expert.id} />
                <BotaoEnviar
                  enviando="Desconectando…"
                  className="text-sm text-apagado hover:text-texto"
                >
                  Desconectar a Berry deste expert
                </BotaoEnviar>
              </form>
            </details>
          </>
        ) : (
          <>
            <FormChave expertId={expert.id} />
            <p className="mt-3 text-sm text-apagado">
              A chave é da conta Berry de {expert.nome} e começa com{" "}
              <span className="font-mono">bp_live_</span>. Quem gera é o suporte
              da Berry: peça uma chave só de leitura. Ela fica guardada cifrada e
              não aparece de novo para ninguém.
            </p>
          </>
        )}
      </section>

      {conexao && !falha ? (
        <section className="mt-6 max-w-2xl">
          <h2 className="font-semibold">Produto do ingresso em cada lançamento</h2>
          {lancamentos.length ? (
            <ul className="mt-3 grid gap-3">
              {lancamentos.map((lancamento) => (
                <li
                  key={lancamento.id}
                  className="rounded-xl border border-borda bg-cartao p-5"
                >
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <Link
                      href={`/lancamentos/${lancamento.id}`}
                      className="font-semibold hover:text-power-claro"
                    >
                      {lancamento.nome}
                    </Link>
                    {lancamento.situacao === "encerrado" ? (
                      <span className="text-xs text-apagado">Encerrado</span>
                    ) : null}
                  </div>
                  {/* A chave refaz o campo depois de salvar, já com o produto novo. */}
                  <SeletorProduto
                    key={lancamento.berry_produto_id ?? ""}
                    lancamentoId={lancamento.id}
                    lancamentoNome={lancamento.nome}
                    atual={lancamento.berry_produto_id}
                    produtos={produtos}
                  />
                  {vendas.has(lancamento.id) ? (
                    <p className="mt-3 text-sm text-apagado">
                      <span className="font-semibold text-texto">
                        {formatarInteiro(vendas.get(lancamento.id)!)}
                      </span>{" "}
                      {vendas.get(lancamento.id) === 1 ? "venda paga" : "vendas pagas"}{" "}
                      na Berry
                      {lancamento.dv0
                        ? ` desde o DV0 (${formatarData(lancamento.dv0)})`
                        : " desde sempre (lançamento sem DV0)"}
                      .
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-xl border border-borda bg-cartao p-5 text-sm text-apagado">
              Este expert ainda não tem lançamento. Depois de{" "}
              <Link
                href={`/experts/${expert.id}/novo`}
                className="text-texto underline hover:text-power-claro"
              >
                cadastrar um
              </Link>
              , volte aqui para escolher o produto do ingresso.
            </p>
          )}
        </section>
      ) : null}
    </>
  );
}
