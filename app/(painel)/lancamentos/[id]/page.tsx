import Link from "next/link";
import { notFound } from "next/navigation";
import { BotaoEnviar } from "@/app/botao-enviar";
import { diaDe, diasEntre, formatarData, hoje } from "@/lib/datas";
import {
  contagem,
  CORES,
  montarLinhaDoTempo,
  tituloDoItem,
  type Checkpoint,
} from "@/lib/linha-do-tempo";
import { faseDoLancamento, TIPOS, type Lancamento } from "@/lib/marcos";
import {
  calcular,
  haQuanto,
  participacaoERetencao,
  retorno,
  STATUS,
  type Foto,
} from "@/lib/metricas";
import { ehBlack, rotulos, semIngresso } from "@/lib/rotulos";
import {
  formatarInteiro,
  formatarPercentual,
  formatarPercentualParaBaixo,
  formatarReal,
} from "@/lib/numeros";
import { obterSessao } from "@/lib/sessao";
import { calcularUrgencia, metasFechadasParaEstrategista } from "@/lib/urgencia";
import { criarProximaTurma, definirSituacao } from "../actions";
import { PainelMetas } from "../painel-metas";
import { disparoDoMetaLigado } from "@/lib/meta-disparo";
import { BotaoBerry, BotaoMeta, ExcluirLancamento, TesteMeta } from "../../interacoes";
import { quando } from "@/lib/conexoes";
import { LinhaDoTempo } from "../linha-do-tempo";
import { FormAtualizacao } from "./form-atualizacao";

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs text-apagado">{rotulo}</p>
      <p className="mt-0.5 font-semibold">{valor}</p>
    </div>
  );
}

// A rotina grava até três fotos por dia: no celular, só as mais recentes abertas.
const FICHAS_NO_CELULAR = 7;

export default async function LancamentoPage({
  params,
}: PageProps<"/lancamentos/[id]">) {
  const { id } = await params;
  const { supabase, perfil } = await obterSessao();

  const [{ data }, { data: lista }, { data: historico }, { data: seguinte }] = await Promise.all([
    supabase
      .from("lancamentos")
      .select("*, experts(nome)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("checkpoints").select("*").eq("lancamento_id", id),
    supabase
      .from("fotos_metricas")
      .select("*")
      .eq("lancamento_id", id)
      .order("criado_em", { ascending: false }),
    // Semanal: a turma seguinte, se já foi criada.
    supabase.from("lancamentos").select("id").eq("turma_de", id).limit(1).maybeSingle(),
  ]);
  if (!data) notFound();

  const lancamento = data as Lancamento & { experts: { nome: string } };
  const fotos = (historico ?? []) as Foto[];
  const ultima = fotos[0] ?? null;
  const dia = hoje();
  const fase = faseDoLancamento(lancamento, dia);
  const encerrado = lancamento.situacao === "encerrado";
  // Gratuito: leads e CPL, sem Berry e sem receita; entra participação e retenção.
  const gratuito = semIngresso(lancamento.tipo);
  const black = ehBlack(lancamento.tipo);
  const r = rotulos(lancamento.tipo);
  const { itens, proximo, atrasados } = montarLinhaDoTempo(
    lancamento,
    (lista ?? []) as Checkpoint[],
    dia,
  );

  const status = lancamento.status ? STATUS[lancamento.status] : null;
  const diasSemAtualizar = lancamento.status_atualizado_em
    ? diasEntre(diaDe(lancamento.status_atualizado_em), dia)
    : null;
  const numeros = ultima ? calcular(ultima) : null;
  const evento = participacaoERetencao(ultima);
  const ret = retorno(ultima);
  const temPrincipal = lancamento.berry_principais?.length > 0 || ret.vendasPrincipal != null;
  const urgencia = calcularUrgencia({
    lancamento,
    foto: ultima,
    atrasos: itens.filter((item) => item.cor === "atrasado").map((item) => -item.dias),
    hoje: dia,
  });

  // Cada coluna do histórico, na mesma ordem na tabela e nas fichas do celular.
  const colunasDaFoto = (foto: Foto): [string, string][] => {
    const calculo = calcular(foto);
    const grupo = `${formatarInteiro(foto.grupo_whatsapp)}${
      calculo.comparecimento != null
        ? ` (${formatarPercentualParaBaixo(calculo.comparecimento)})`
        : ""
    }`;
    if (black) {
      return [
        ["Verba", formatarReal(foto.verba_investida)],
        ["No grupo", formatarInteiro(foto.ingressos_vendidos)],
        ["Do tráfego", formatarInteiro(calculo.doTrafego)],
        ["Convidados", formatarInteiro(foto.disparos)],
        ["CPL", formatarReal(calculo.cpa)],
        ["Na live", formatarInteiro(foto.comp_evento)],
        ["Faturamento", formatarReal(foto.faturamento_produto)],
      ];
    }
    if (gratuito) {
      return [
        ["Verba", formatarReal(foto.verba_investida)],
        ["Leads", formatarInteiro(foto.ingressos_vendidos)],
        ["Do tráfego", formatarInteiro(calculo.doTrafego)],
        ["Grupo WhatsApp", grupo],
        ["CPL", formatarReal(calculo.cpa)],
        ["Ao vivo", formatarInteiro(foto.comp_evento)],
        ["Até o final", formatarInteiro(foto.retencao_final)],
      ];
    }
    return [
      ["Verba", formatarReal(foto.verba_investida)],
      ["Ingressos", formatarInteiro(foto.ingressos_vendidos)],
      ["Do tráfego", formatarInteiro(calculo.doTrafego)],
      ["Receita", formatarReal(foto.receita_ingressos)],
      ["Grupo WhatsApp", grupo],
      ["CPA", formatarReal(calculo.cpa)],
      ["Ticket médio", formatarReal(calculo.ticketMedio)],
    ];
  };
  const quemPreencheu = (foto: Foto) =>
    foto.preenchido_por_nome ?? (foto.fonte === "manual" ? "—" : foto.fonte);
  const fichaDaFoto = (foto: Foto) => (
    <div key={foto.id} className="rounded-xl border border-borda bg-cartao p-4 text-sm">
      <p className="flex flex-wrap justify-between gap-x-3">
        <span className="font-semibold">{formatarData(foto.data)}</span>
        <span className="text-apagado">{quemPreencheu(foto)}</span>
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
        {colunasDaFoto(foto).map(([rotulo, valor]) => (
          <div key={rotulo}>
            <dt className="text-xs text-apagado">{rotulo}</dt>
            <dd>{valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  );

  return (
    <>
      <Link
        href={`/experts/${lancamento.expert_id}`}
        className="text-sm text-apagado hover:text-texto"
      >
        ← {lancamento.experts.nome}
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{lancamento.nome}</h1>
          <p className="mt-1 text-sm text-apagado">
            {TIPOS[lancamento.tipo]}
            {lancamento.meta_ingressos != null
              ? ` · meta de ${formatarInteiro(lancamento.meta_ingressos)} ${r.unidades}`
              : ""}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-sm ${fase.cor}`}>
          {fase.rotulo}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <Link
          href={`/lancamentos/${lancamento.id}/editar`}
          className="rounded-lg border border-borda px-3 py-1.5 hover:border-power"
        >
          Editar lançamento
        </Link>
        {/* No gratuito não há ingresso, mas dá para ligar o produto principal. */}
        <Link
          href={`/experts/${lancamento.expert_id}/berry`}
          className="rounded-lg border border-borda px-3 py-1.5 hover:border-power"
        >
          {lancamento.berry_produto_nome
            ? `Berry: ${lancamento.berry_produto_nome}`
            : lancamento.berry_principais?.length
              ? "Berry: produto principal ligado"
              : gratuito
                ? "Ligar o produto principal (Berry)"
                : "Conectar Berry"}
        </Link>
        {lancamento.berry_produto_id || lancamento.berry_principais?.length ? (
          <BotaoBerry lancamentoId={lancamento.id} />
        ) : null}
        {!encerrado &&
        !lancamento.sem_trafego &&
        lancamento.meta_conta_id &&
        lancamento.meta_filtro &&
        disparoDoMetaLigado() ? (
          <BotaoMeta lancamentoId={lancamento.id} />
        ) : null}
        <form action={definirSituacao}>
          <input type="hidden" name="id" value={lancamento.id} />
          <input type="hidden" name="situacao" value={encerrado ? "ativo" : "encerrado"} />
          <BotaoEnviar className="text-sm text-apagado hover:text-texto">
            {encerrado ? "Reabrir lançamento" : "Encerrar lançamento"}
          </BotaoEnviar>
        </form>
        {/* Semanal: as turmas ficam encadeadas, cada uma com os seus números. */}
        {lancamento.turma_de ? (
          <Link
            href={`/lancamentos/${lancamento.turma_de}`}
            className="text-sm text-apagado hover:text-texto"
          >
            ← Turma anterior
          </Link>
        ) : null}
        {lancamento.tipo === "LPS" ? (
          seguinte ? (
            <Link
              href={`/lancamentos/${seguinte.id}`}
              className="text-sm text-apagado hover:text-texto"
            >
              Próxima turma →
            </Link>
          ) : (
            <form action={criarProximaTurma}>
              <input type="hidden" name="id" value={lancamento.id} />
              <BotaoEnviar
                className="rounded-lg border border-borda px-3 py-1.5 hover:border-power"
                enviando="Criando…"
              >
                Criar próxima turma
              </BotaoEnviar>
            </form>
          )
        ) : null}
        {perfil?.papel === "admin" ? (
          <ExcluirLancamento id={lancamento.id} nome={lancamento.nome} />
        ) : null}
      </div>

      {/* Teste de conexão com a conta de anúncios: para o estrategista e o admin. */}
      {!encerrado && !lancamento.sem_trafego && disparoDoMetaLigado() ? (
        <TesteMeta
          lancamentoId={lancamento.id}
          conta={lancamento.meta_conta_id ?? lancamento.meta_teste_conta}
          pedidoEm={
            lancamento.meta_teste_pedido_em &&
            (!lancamento.meta_teste_feito_em ||
              lancamento.meta_teste_feito_em < lancamento.meta_teste_pedido_em)
              ? `em ${quando(lancamento.meta_teste_pedido_em)}`
              : null
          }
          resposta={
            lancamento.meta_teste_feito_em && lancamento.meta_teste_ok != null
              ? {
                  ok: lancamento.meta_teste_ok,
                  detalhe: lancamento.meta_teste_detalhe ?? "",
                  quando: `em ${quando(lancamento.meta_teste_feito_em)}`,
                }
              : null
          }
        />
      ) : null}

      <section className="mt-6 rounded-xl border border-borda bg-cartao p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-semibold">
            {status ? (
              <>
                <span className={`h-3 w-3 rounded-full ${status.ponto}`} />
                {status.rotulo}
              </>
            ) : (
              "Sem atualização ainda"
            )}
          </h2>
          {diasSemAtualizar != null ? (
            <span
              className={`text-sm ${
                diasSemAtualizar > 7 ? "text-power-claro" : "text-apagado"
              }`}
            >
              Atualizado {haQuanto(diasSemAtualizar)}
              {lancamento.status_atualizado_por_nome
                ? ` por ${lancamento.status_atualizado_por_nome}`
                : ""}
            </span>
          ) : null}
        </div>

        <div className="mt-4 border-t border-borda pt-4">
          <PainelMetas urgencia={urgencia} />
          {urgencia.faltaMeta ? (
            <p className="mt-3 text-sm text-apagado">
              {perfil?.papel === "admin" ||
              !metasFechadasParaEstrategista(lancamento, dia) ? (
                <>
                  Falta definir meta.{" "}
                  <Link
                    href={`/lancamentos/${lancamento.id}/editar`}
                    className="text-texto underline hover:text-power-claro"
                  >
                    Definir metas
                  </Link>
                </>
              ) : (
                "Falta meta e as vendas já começaram: peça ao Ricardo para definir."
              )}
            </p>
          ) : null}
        </div>

        {ultima && numeros ? (
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-borda pt-4 sm:grid-cols-4">
            <Numero
              rotulo="Verba investida"
              valor={
                formatarReal(ultima.verba_investida) +
                (lancamento.verba_prevista
                  ? ` de ${formatarReal(lancamento.verba_prevista)} (${formatarPercentual((ultima.verba_investida ?? 0) / lancamento.verba_prevista)})`
                  : "")
              }
            />
            {black ? (
              <>
                <Numero
                  rotulo="Convidados pelos disparos"
                  valor={
                    formatarInteiro(ultima.disparos) +
                    (ultima.disparos && ultima.ingressos_vendidos != null
                      ? ` (${formatarPercentualParaBaixo(ultima.ingressos_vendidos / ultima.disparos)} entraram)`
                      : "")
                  }
                />
                <Numero
                  rotulo="Comparecimento na live"
                  valor={
                    formatarInteiro(ultima.comp_evento) +
                    (ultima.comp_evento != null && ultima.ingressos_vendidos
                      ? ` (${formatarPercentual(ultima.comp_evento / ultima.ingressos_vendidos)} do grupo)`
                      : "")
                  }
                />
                <Numero
                  rotulo="Faturamento do produto principal"
                  valor={formatarReal(ultima.faturamento_produto)}
                />
              </>
            ) : gratuito ? (
              <>
              <Numero
                rotulo="No grupo de WhatsApp"
                valor={
                  formatarInteiro(ultima.grupo_whatsapp) +
                  (numeros.comparecimento != null
                    ? ` (${formatarPercentualParaBaixo(numeros.comparecimento)})`
                    : "")
                }
              />
                <Numero
                  rotulo="Participação ao vivo"
                  valor={
                    formatarInteiro(evento.aoVivo) +
                    (evento.participacao != null
                      ? ` (${formatarPercentual(evento.participacao)} dos leads)`
                      : "")
                  }
                />
                <Numero
                  rotulo="Retenção até o final"
                  valor={
                    formatarInteiro(evento.ateOFinal) +
                    (evento.retencao != null
                      ? ` (${formatarPercentual(evento.retencao)} de quem entrou)`
                      : "")
                  }
                />
              </>
            ) : (
              <>
              <Numero rotulo="Receita de ingressos" valor={formatarReal(ultima.receita_ingressos)} />
              <Numero
                rotulo="No grupo de WhatsApp"
                valor={
                  formatarInteiro(ultima.grupo_whatsapp) +
                  (numeros.comparecimento != null
                    ? ` (${formatarPercentualParaBaixo(numeros.comparecimento)})`
                    : "")
                }
              />
              <Numero rotulo="Ticket médio" valor={formatarReal(numeros.ticketMedio)} />
              </>
            )}
          </div>
        ) : null}

        {/* Retorno: ROI dos ingressos (pago) e produto principal. */}
        {(!gratuito && ret.roiIngressos != null) || temPrincipal ? (
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-borda pt-4 sm:grid-cols-4">
            {gratuito ? null : (
              <Numero
                rotulo="ROI de ingressos (receita contra a verba)"
                valor={
                  ret.roiIngressos == null
                    ? "—"
                    : `${ret.roiIngressos >= 0 ? "+" : "−"}${formatarPercentual(Math.abs(ret.roiIngressos))}`
                }
              />
            )}
            <Numero
              rotulo="Vendas do produto principal"
              valor={temPrincipal ? formatarInteiro(ret.vendasPrincipal) : "Produto não ligado"}
            />
            <Numero
              rotulo="Faturamento do produto principal"
              valor={formatarReal(ret.faturamentoPrincipal)}
            />
            <Numero rotulo="CAC (verba ÷ vendas do principal)" valor={formatarReal(ret.cac)} />
          </div>
        ) : null}

        {/* Tráfego x orgânico: só quando o Meta informa as compras das campanhas. */}
        {numeros?.doTrafego != null ? (
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-borda pt-4 sm:grid-cols-4">
            <Numero
              rotulo={r.doTrafego}
              valor={`${formatarInteiro(numeros.doTrafego)} (${formatarPercentual(numeros.parteDoTrafego)} dos ${r.unidades})`}
            />
            <Numero
              rotulo={r.organicas}
              valor={`${formatarInteiro(numeros.organicas)} (${formatarPercentual(numeros.parteOrganica)} dos ${r.unidades})`}
            />
          </div>
        ) : null}

        <details className="mt-4 border-t border-borda pt-4" open={!status}>
          <summary className="cursor-pointer list-none">
            <span className="inline-block rounded-lg bg-power px-4 py-2 font-semibold hover:brightness-125">
              Atualizar lançamento
            </span>
          </summary>
          <FormAtualizacao lancamento={lancamento} ultima={ultima} hoje={dia} />
        </details>
      </section>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-borda bg-cartao p-5">
          <p className="text-sm text-apagado">Próximo</p>
          {proximo ? (
            <>
              <p className="mt-1 font-semibold">{tituloDoItem(proximo)}</p>
              <p className={`text-sm ${CORES[proximo.cor].texto}`}>
                {formatarData(proximo.data)} · {contagem(proximo.dias)}
              </p>
            </>
          ) : (
            <p className="mt-1 font-semibold">Nada pela frente</p>
          )}
        </div>
        <div className="rounded-xl border border-borda bg-cartao p-5">
          <p className="text-sm text-apagado">Atrasados</p>
          <p
            className={`mt-1 text-2xl font-semibold ${
              atrasados ? "text-power-claro" : "text-ok"
            }`}
          >
            {atrasados}
          </p>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="font-semibold">Linha do tempo</h2>
        <div className="mt-3">
          <LinhaDoTempo itens={itens} proximo={proximo} hoje={dia} quem={perfil?.nome ?? ""} />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">Histórico de métricas</h2>
        {fotos.length ? (
          <>
            {/* Do tablet para cima, tabela; no celular, uma ficha por foto, sem rolar de lado. */}
            <div className="mt-3 hidden overflow-x-auto rounded-xl border border-borda bg-cartao md:block">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="text-xs text-apagado">
                  <tr>
                    {["Data", "Quem", ...colunasDaFoto(fotos[0]).map(([rotulo]) => rotulo)].map((coluna) => (
                      <th key={coluna} className="px-4 py-3 font-normal">
                        {coluna}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-borda">
                  {fotos.map((foto) => (
                    <tr key={foto.id}>
                      <td className="px-4 py-3">{formatarData(foto.data)}</td>
                      <td className="px-4 py-3">{quemPreencheu(foto)}</td>
                      {colunasDaFoto(foto).map(([rotulo, valor]) => (
                        <td key={rotulo} className="px-4 py-3">
                          {valor}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 grid gap-3 md:hidden">
              {fotos.slice(0, FICHAS_NO_CELULAR).map(fichaDaFoto)}
              {fotos.length > FICHAS_NO_CELULAR ? (
                <details>
                  <summary className="cursor-pointer rounded-xl border border-borda bg-cartao px-4 py-3 text-sm">
                    Ver as outras {fotos.length - FICHAS_NO_CELULAR}
                  </summary>
                  <div className="mt-3 grid gap-3">
                    {fotos.slice(FICHAS_NO_CELULAR).map(fichaDaFoto)}
                  </div>
                </details>
              ) : null}
            </div>
          </>
        ) : (
          <p className="mt-3 rounded-xl border border-borda bg-cartao p-5 text-sm text-apagado">
            Nenhuma foto de métricas ainda. Ela nasce a cada atualização do lançamento.
          </p>
        )}
      </section>

    </>
  );
}
