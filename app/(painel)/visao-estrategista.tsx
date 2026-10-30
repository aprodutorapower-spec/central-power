import Link from "next/link";
import { BotaoEnviar } from "@/app/botao-enviar";
import { podeEncerrar } from "@/lib/avisos";
import { textoCobranca } from "@/lib/cobranca";
import { avisosDeConexao, verbaParada } from "@/lib/conexoes";
import { formatarData } from "@/lib/datas";
import { contagem, CORES, montarLinhaDoTempo, tituloDoItem } from "@/lib/linha-do-tempo";
import {
  calcular,
  COMPARECIMENTO,
  haQuanto,
  participacaoERetencao,
  retorno,
  STATUS,
} from "@/lib/metricas";
import {
  formatarInteiro,
  formatarPercentual,
  formatarPercentualParaBaixo,
  formatarReal,
} from "@/lib/numeros";
import type { GrupoEstrategista, ItemPainel } from "@/lib/painel";
import { ehBlack, rotulos, semIngresso } from "@/lib/rotulos";
import { BotaoCopiar, CartaoComPainel } from "./interacoes";
import { criarProximaTurma, definirSituacao } from "./lancamentos/actions";
import { LinhaDoTempo } from "./lancamentos/linha-do-tempo";
import {
  BarraIngressos,
  LinhaMetaCpa,
  SeloFaixa,
  SeloMeta,
} from "./lancamentos/painel-metas";
import { Contagens, CpaDoGrupo, IngressosDoGrupo, VerbaDoGrupo } from "./visao-geral";

const BOTAO =
  "rounded-lg border border-borda px-3 py-1.5 text-sm hover:border-power";

// Bloco padrão do cartão: rótulo e selo em cima, o número no meio e um
// detalhe embaixo. Todos têm o mesmo formato para a leitura ser em grade.
function Bloco({
  rotulo,
  selo,
  valor,
  detalhe,
  children,
}: {
  rotulo: string;
  selo?: React.ReactNode;
  valor: React.ReactNode;
  detalhe?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-cartao-2 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-apagado">{rotulo}</p>
        {selo}
      </div>
      <p className="mt-1 font-semibold">{valor}</p>
      {children}
      {detalhe ? <div className="mt-1 text-xs text-apagado">{detalhe}</div> : null}
    </div>
  );
}

// No CPA, subir é ruim e cair é bom.
const TENDENCIAS = {
  subindo: { icone: "↑", texto: "subindo", cor: "text-power-claro" },
  caindo: { icone: "↓", texto: "caindo", cor: "text-ok" },
  estavel: { icone: "→", texto: "estável", cor: "text-apagado" },
};

function Rotulo({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-apagado">{children}</p>;
}

function CartaoLancamento({
  item,
  estrategista,
  hoje,
  quem,
  admin,
  temProximaTurma,
}: {
  // Semanal: a turma seguinte já foi criada.
  temProximaTurma: boolean;
  item: ItemPainel;
  estrategista: string | null;
  hoje: string;
  quem: string;
  admin: boolean;
}) {
  const { lancamento, urgencia, foto } = item;
  const { itens, proximo } = montarLinhaDoTempo(lancamento, item.checkpoints, hoje);
  const numeros = foto ? calcular(foto) : null;
  const status = lancamento.status ? STATUS[lancamento.status] : null;
  const tendencia = item.tendenciaCpa ? TENDENCIAS[item.tendenciaCpa] : null;
  const cobranca = admin
    ? textoCobranca({
        estrategista,
        expert: item.expert,
        lancamento,
        urgencia,
        atrasados: item.atrasados,
      })
    : null;
  const titulo = `${item.expert} · ${lancamento.nome}`;
  const grave = urgencia.faixa === "abaixo" || urgencia.faixa === "sem_dados";
  // Gratuito: leads e CPL, e os dois blocos de receita viram participação e retenção.
  const gratuito = semIngresso(lancamento.tipo);
  // Black: a meta é a entrada no grupo; os blocos de grupo, ticket e receita
  // viram convidados, live e faturamento.
  const black = ehBlack(lancamento.tipo);
  const r = rotulos(lancamento.tipo);
  const evento = participacaoERetencao(foto);
  // ROI de ingressos e produto principal (vendas, faturamento e CAC).
  const ret = retorno(foto);
  const temPrincipal = lancamento.berry_principais?.length > 0 || ret.vendasPrincipal != null;
  const terminou = podeEncerrar(lancamento, item.checkpoints, hoje);
  // Lançamento terminado não cobra conexão: a sugestão é encerrar.
  const conexoes = terminou ? [] : avisosDeConexao(lancamento, hoje, new Date());
  const parada = verbaParada(lancamento, item.fotos, hoje);

  return (
    <CartaoComPainel
      id={`lancamento-${lancamento.id}`}
      titulo={titulo}
      painel={<LinhaDoTempo itens={itens} proximo={proximo} hoje={hoje} quem={quem} />}
      className={`scroll-mt-16 rounded-xl border bg-cartao p-4 hover:border-apagado sm:p-5 ${
        urgencia.faixa === "abaixo" ? "border-power" : "border-borda"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-apagado">
            <span className="rounded-full border border-borda px-2 py-0.5 text-xs text-texto">
              {lancamento.tipo}
            </span>
            <span>
              D0 {formatarData(lancamento.d0)} ·{" "}
              <span className="text-texto">
                {urgencia.diasAteD0 > 0
                  ? `faltam ${urgencia.diasAteD0} ${urgencia.diasAteD0 === 1 ? "dia" : "dias"}`
                  : urgencia.diasAteD0 === 0
                    ? "é hoje"
                    : `D+${-urgencia.diasAteD0}`}
              </span>
            </span>
          </p>
        </div>
        <SeloFaixa faixa={urgencia.faixa} />
      </div>

      <p
        className={`mt-3 border-l-2 pl-3 ${
          grave ? "border-power-claro font-semibold" : "border-borda text-apagado"
        }`}
      >
        {urgencia.motivo}
      </p>

      {/* Oito blocos do mesmo tamanho. Em cima: os três critérios e o ticket
          médio. Embaixo: o investido ao lado do que entrou, e a linha do tempo. */}
      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Bloco
          rotulo={r.Unidades}
          selo={<SeloMeta status={urgencia.ingressos.status} />}
          valor={
            formatarInteiro(urgencia.ingressos.vendidos) +
            (urgencia.ingressos.meta != null
              ? ` de ${formatarInteiro(urgencia.ingressos.meta)}`
              : "")
          }
          detalhe={
            urgencia.ingressos.meta != null
              ? `Esperado até hoje: ${formatarInteiro(urgencia.ingressos.esperado)}`
              : `Sem meta de ${r.unidades}`
          }
        >
          <BarraIngressos urgencia={urgencia} />
        </Bloco>
        <Bloco
          rotulo={r.custo}
          selo={<SeloMeta status={urgencia.cpa.status} />}
          valor={
            <>
              {formatarReal(urgencia.cpa.atual)}
              {tendencia ? (
                <span className={`ml-2 text-sm font-normal ${tendencia.cor}`}>
                  <span aria-hidden>{tendencia.icone}</span> {tendencia.texto}
                </span>
              ) : null}
            </>
          }
          detalhe={<LinhaMetaCpa urgencia={urgencia} />}
        />
        {black ? (
          <Bloco
            rotulo="Entrada no grupo"
            valor={
              formatarInteiro(urgencia.convite.convidados) +
              (urgencia.convite.entrada != null
                ? ` (${formatarPercentualParaBaixo(urgencia.convite.entrada)})`
                : "")
            }
            detalhe="Convidados pelos disparos · % que entrou no grupo"
          />
        ) : (
        <Bloco
          rotulo="Grupo de WhatsApp"
          selo={gratuito ? undefined : <SeloMeta status={urgencia.grupo.status} />}
          valor={
            formatarInteiro(urgencia.grupo.pessoas) +
            (urgencia.grupo.proporcao != null
              ? ` (${formatarPercentualParaBaixo(urgencia.grupo.proporcao)})`
              : "")
          }
          detalhe={
            gratuito
              ? "Dos leads captados · sem mínimo no gratuito"
              : `Mínimo: ${formatarPercentual(urgencia.grupo.minimo)} dos ingressos` +
                (urgencia.grupo.faltam
                  ? urgencia.grupo.faltam === 1
                    ? " · falta 1 pessoa"
                    : ` · faltam ${urgencia.grupo.faltam} pessoas`
                  : "")
          }
        />
        )}
        {black ? (
          <Bloco
            rotulo="Comparecimento na live"
            valor={
              formatarInteiro(foto?.comp_evento) +
              (foto?.comp_evento != null && foto?.ingressos_vendidos
                ? ` (${formatarPercentual(foto.comp_evento / foto.ingressos_vendidos)})`
                : "")
            }
            detalhe="Na live ÷ pessoas no grupo"
          />
        ) : gratuito ? (
          <Bloco
            rotulo="Participação ao vivo"
            valor={
              formatarInteiro(evento.aoVivo) +
              (evento.participacao != null
                ? ` (${formatarPercentual(evento.participacao)})`
                : "")
            }
            detalhe="Ao vivo ÷ leads captados"
          />
        ) : (
          <Bloco
            rotulo="Ticket médio"
            valor={formatarReal(numeros?.ticketMedio)}
            detalhe="Receita ÷ ingressos"
          />
        )}
        <Bloco
          rotulo="Verba investida"
          valor={formatarReal(foto?.verba_investida)}
          detalhe={
            lancamento.verba_prevista
              ? `${formatarPercentual((foto?.verba_investida ?? 0) / lancamento.verba_prevista)} de ${formatarReal(lancamento.verba_prevista)} previstos`
              : lancamento.sem_trafego
                ? "Sem tráfego pago"
                : "Sem verba total prevista"
          }
        />
        {black ? (
          <Bloco
            rotulo="Faturamento do produto principal"
            valor={formatarReal(foto?.faturamento_produto)}
            detalhe={
              lancamento.berry_principais?.length ? "Vem da Berry" : "Informado na atualização"
            }
          />
        ) : gratuito ? (
          <Bloco
            rotulo="Retenção até o final"
            valor={
              formatarInteiro(evento.ateOFinal) +
              (evento.retencao != null ? ` (${formatarPercentual(evento.retencao)})` : "")
            }
            detalhe="Ficaram até o final ÷ ao vivo"
          />
        ) : (
          <Bloco
            rotulo="Ingressos + order bumps"
            valor={formatarReal(foto?.receita_ingressos)}
            detalhe="Receita das vendas"
          />
        )}
        <Bloco
          rotulo="Próximo na linha do tempo"
          valor={
            proximo ? (
              <span className="text-sm">{tituloDoItem(proximo)}</span>
            ) : (
              <span className="text-sm font-normal text-apagado">Nada pela frente</span>
            )
          }
          detalhe={
            proximo ? (
              <span className={CORES[proximo.cor].texto}>
                {formatarData(proximo.data)} · {contagem(proximo.dias)}
              </span>
            ) : undefined
          }
        />
        <Bloco
          rotulo="Checkpoints atrasados"
          valor={
            item.atrasados.length ? (
              <span className="text-power-claro">{item.atrasados.length}</span>
            ) : (
              <span className="text-sm font-normal text-apagado">Nenhum</span>
            )
          }
          detalhe={
            item.atrasados.length
              ? (
                  // No celular a lista inteira esticava a linha; ela está completa na linha do tempo.
                  <span className="line-clamp-3 md:line-clamp-none">
                    {item.atrasados
                      .map((a) => `${a.titulo} há ${a.dias} ${a.dias === 1 ? "dia" : "dias"}`)
                      .join(" · ")}
                  </span>
                )
              : undefined
          }
        />
      </div>

      {/* Retorno: ROI dos ingressos (pago) e produto principal, quando há o que mostrar. */}
      {(!gratuito && ret.roiIngressos != null) || temPrincipal ? (
        <div className="mt-2 rounded-lg bg-cartao-2 px-3 py-2.5">
          <p className="text-xs text-apagado">Retorno</p>
          <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-2 lg:grid-cols-4">
            {gratuito ? null : (
              <div>
                <dt className="text-xs text-apagado">ROI de ingressos</dt>
                <dd className="font-semibold">
                  {ret.roiIngressos == null ? (
                    "—"
                  ) : (
                    <span className={ret.roiIngressos >= 0 ? "text-ok" : "text-power-claro"}>
                      {ret.roiIngressos >= 0 ? "+" : "−"}
                      {formatarPercentual(Math.abs(ret.roiIngressos))}
                    </span>
                  )}
                  <span className="ml-1.5 text-sm font-normal text-apagado">
                    receita contra a verba
                  </span>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-apagado">Vendas do produto principal</dt>
              <dd className="font-semibold">
                {temPrincipal ? (
                  formatarInteiro(ret.vendasPrincipal)
                ) : (
                  <span className="text-sm font-normal text-apagado">Produto não ligado</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-apagado">Faturamento do produto principal</dt>
              <dd className="font-semibold">{formatarReal(ret.faturamentoPrincipal)}</dd>
            </div>
            <div>
              <dt className="text-xs text-apagado">CAC (verba ÷ vendas do principal)</dt>
              <dd className="font-semibold">{formatarReal(ret.cac)}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      {/* Tráfego x orgânico: aparece quando o Meta informa as compras das
          campanhas. O CPA é sobre as do tráfego; as orgânicas só somam no total. */}
      {numeros?.doTrafego != null ? (
        <div className="mt-2 rounded-lg bg-cartao-2 px-3 py-2.5">
          <p className="text-xs text-apagado">Tráfego x orgânico</p>
          <dl className="mt-1 grid grid-cols-2 gap-x-4">
            <div>
              <dt className="text-xs text-apagado">{r.doTrafego}</dt>
              <dd className="font-semibold">
                {formatarInteiro(numeros.doTrafego)}
                <span className="ml-1.5 text-sm font-normal text-apagado">
                  {formatarPercentual(numeros.parteDoTrafego)} dos {r.unidades}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-apagado">{r.organicas}</dt>
              <dd className="font-semibold">
                {formatarInteiro(numeros.organicas)}
                <span className="ml-1.5 text-sm font-normal text-apagado">
                  {formatarPercentual(numeros.parteOrganica)} dos {r.unidades}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

      {/* A partir do dia do evento: quantos compareceram, contra os ingressos. */}
      {/* No gratuito, participação e retenção já têm bloco próprio na grade. */}
      {hoje >= lancamento.d0 && !gratuito ? (
        <div className="mt-2 rounded-lg bg-cartao-2 px-3 py-2.5">
          <p className="text-xs text-apagado">Comparecimento no evento</p>
          <dl
            className={`mt-1 grid gap-x-4 gap-y-2 ${
              lancamento.tipo === "LPS" ? "grid-cols-3 lg:grid-cols-6" : "grid-cols-1"
            }`}
          >
            {COMPARECIMENTO[lancamento.tipo].map(({ campo, rotulo }) => {
              const presentes = foto?.[campo] ?? null;
              const proporcao =
                presentes != null && foto?.ingressos_vendidos
                  ? presentes / foto.ingressos_vendidos
                  : null;
              return (
                <div key={campo}>
                  {lancamento.tipo === "LPS" ? (
                    <dt className="text-xs text-apagado">{rotulo}</dt>
                  ) : null}
                  <dd className="font-semibold">
                    {presentes == null ? (
                      <span className="text-sm font-normal text-apagado">Não preenchido</span>
                    ) : (
                      <>
                        {formatarInteiro(presentes)}
                        {proporcao != null ? (
                          <span className="ml-1.5 text-sm font-normal text-apagado">
                            {formatarPercentual(proporcao)}
                            {lancamento.tipo === "LP" ? " dos ingressos" : ""}
                          </span>
                        ) : null}
                      </>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      ) : null}

      {lancamento.bloqueio || lancamento.proximo_passo ? (
        <p className="mt-3 text-sm">
          {lancamento.bloqueio ? (
            <>
              <span className="text-apagado">Bloqueio: </span>
              {lancamento.bloqueio}{" "}
            </>
          ) : null}
          {lancamento.proximo_passo ? (
            <>
              <span className="text-apagado">Próximo passo: </span>
              {lancamento.proximo_passo}
            </>
          ) : null}
        </p>
      ) : null}

      {/* Só aparece com a captação aberta, o Meta sendo lido e o investido sem subir. */}
      {parada && !terminou ? (
        <div className="mt-3 rounded-lg border border-power bg-cartao-2 px-3 py-2.5">
          <p className="text-xs text-apagado">Verba parada</p>
          <p className="mt-1 text-sm">
            {parada.texto}. Confira as campanhas e a forma de pagamento da conta de
            anúncios.
          </p>
        </div>
      ) : null}

      {/* Só aparece quando algo que deveria atualizar sozinho não está. */}
      {conexoes.length ? (
        <div className="mt-3 rounded-lg border border-borda bg-cartao-2 px-3 py-2.5">
          <p className="text-xs text-apagado">Atualização automática com problema</p>
          <ul className="mt-1 text-sm">
            {conexoes.map((aviso) => (
              <li key={aviso.texto}>{aviso.texto}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Semanal: a turma da semana começou e a próxima ainda não foi criada. */}
      {lancamento.tipo === "LPS" && hoje >= lancamento.d0 && !temProximaTurma ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-borda bg-cartao-2 px-3 py-2.5">
          <div>
            <p className="text-xs text-apagado">Próxima turma</p>
            <p className="mt-1 text-sm">
              Cria a turma da semana que vem já com as metas, os produtos e a conta de
              anúncios desta.
            </p>
          </div>
          <form action={criarProximaTurma}>
            <input type="hidden" name="id" value={lancamento.id} />
            <BotaoEnviar className={BOTAO} enviando="Criando…">
              Criar próxima turma
            </BotaoEnviar>
          </form>
        </div>
      ) : null}

      {/* Só aparece depois do último marco: encerrar é o que desliga as
          atualizações automáticas deste lançamento. */}
      {terminou ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-borda bg-cartao-2 px-3 py-2.5">
          <div>
            <p className="text-xs text-apagado">Lançamento terminado</p>
            <p className="mt-1 text-sm">
              O último marco foi em {formatarData(terminou)}. Encerrar para sair do painel
              e parar as atualizações automáticas?
            </p>
          </div>
          <form action={definirSituacao}>
            <input type="hidden" name="id" value={lancamento.id} />
            <input type="hidden" name="situacao" value="encerrado" />
            <BotaoEnviar className={BOTAO} enviando="Encerrando…">
              Encerrar lançamento
            </BotaoEnviar>
          </form>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex flex-wrap items-center gap-2">
        {cobranca ? (
          <BotaoCopiar
            texto={cobranca}
            className="rounded-lg bg-power px-4 py-1.5 text-sm font-semibold hover:brightness-125"
          >
            Copiar cobrança
          </BotaoCopiar>
        ) : null}
        <Link href={`/lancamentos/${lancamento.id}`} className={BOTAO}>
          {admin ? "Abrir lançamento" : "Atualizar lançamento"}
        </Link>
        </div>
        <p className="flex flex-wrap items-center gap-x-2 text-sm">
          <span className="text-apagado">Estrategista:</span>
          {status ? (
            <span className="inline-flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${status.ponto}`} aria-hidden />
              {status.rotulo}
            </span>
          ) : null}
          <span className={urgencia.parado ? "text-power-claro" : "text-apagado"}>
            {urgencia.diasSemAtualizar == null
              ? "Nunca atualizado"
              : `Atualizado ${haQuanto(urgencia.diasSemAtualizar)}`}
          </span>
        </p>
      </div>
    </CartaoComPainel>
  );
}

// Tudo o que há para decidir sobre um estrategista numa tela só: lançamentos
// ativos do pior para o melhor, com os que estão bem recolhidos no fim.
export function VisaoDoEstrategista({
  grupo,
  hoje,
  quem,
  admin,
}: {
  grupo: GrupoEstrategista;
  hoje: string;
  quem: string;
  admin: boolean;
}) {
  const { resumo } = grupo;
  const emDia = (item: ItemPainel) =>
    ["na_meta", "acima", "nao_comecou", "sem_trafego"].includes(item.urgencia.faixa);
  const problemas = grupo.itens.filter((item) => !emDia(item));
  const tranquilos = grupo.itens.filter(emDia);
  const comPendencia = tranquilos.filter(
    (item) => item.atrasados.length || item.urgencia.parado,
  ).length;

  const cartao = (item: ItemPainel) => (
    <CartaoLancamento
      key={item.lancamento.id}
      item={item}
      estrategista={grupo.id ? grupo.nome : null}
      hoje={hoje}
      quem={quem}
      admin={admin}
      temProximaTurma={grupo.itens.some((outro) => outro.lancamento.turma_de === item.lancamento.id)}
    />
  );

  return (
    <>
      {resumo.ativos ? (
        <div className="mt-6 grid gap-x-6 gap-y-3 rounded-xl border border-borda bg-cartao px-5 py-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Rotulo>
              {resumo.ativos === 1 ? "1 lançamento ativo" : `${resumo.ativos} lançamentos ativos`}
            </Rotulo>
            <div className="mt-0.5">
              <Contagens resumo={resumo} />
            </div>
          </div>
          <div>
            <Rotulo>Verba investida contra a prevista</Rotulo>
            <p className="mt-0.5">
              <VerbaDoGrupo resumo={resumo} />
            </p>
          </div>
          <div>
            <Rotulo>Ingressos vendidos contra a meta</Rotulo>
            <p className="mt-0.5">
              <IngressosDoGrupo resumo={resumo} />
            </p>
          </div>
          <div>
            <Rotulo>CPA médio</Rotulo>
            <p className="mt-0.5">
              <CpaDoGrupo resumo={resumo} />
            </p>
          </div>
        </div>
      ) : null}

      {!grupo.itens.length ? (
        <p className="mt-6 rounded-xl border border-borda bg-cartao p-6 text-sm text-apagado">
          Nenhum lançamento ativo.
          {admin ? "" : " Cadastre os seus em Meus experts."}
        </p>
      ) : null}

      {/* No celular cada cartão é longo: atalhos fixos para pular entre eles. */}
      {problemas.length > 1 ? (
        <nav
          aria-label="Ir para o lançamento"
          className="sticky top-0 z-20 -mx-4 mt-6 flex gap-2 overflow-x-auto bg-fundo px-4 py-2 md:hidden"
        >
          {problemas.map((item) => (
            <a
              key={item.lancamento.id}
              href={`#lancamento-${item.lancamento.id}`}
              className="flex min-h-11 max-w-[60vw] shrink-0 items-center rounded-full border border-borda bg-cartao px-4 text-sm"
            >
              <span className="truncate">{item.lancamento.nome}</span>
            </a>
          ))}
        </nav>
      ) : null}

      {problemas.length ? <ol className="mt-6 grid gap-4 max-md:mt-2">{problemas.map(cartao)}</ol> : null}

      {tranquilos.length ? (
        // Sem nenhum problema na tela, os que estão em dia já aparecem abertos.
        <details className="mt-6" open={!problemas.length}>
          <summary className="cursor-pointer rounded-xl border border-borda bg-cartao px-5 py-3 font-semibold hover:border-power">
            Em dia ({tranquilos.length})
            <span className="ml-2 text-sm font-normal text-apagado">
              {tranquilos.map((item) => item.expert).join(", ")}
              {comPendencia
                ? ` · ${comPendencia} com checkpoint atrasado ou sem atualização`
                : ""}
            </span>
          </summary>
          <ol className="mt-4 grid gap-4">{tranquilos.map(cartao)}</ol>
        </details>
      ) : null}
    </>
  );
}
