import Link from "next/link";
import { textoCobranca } from "@/lib/cobranca";
import { formatarData } from "@/lib/datas";
import { contagem, CORES, montarLinhaDoTempo, tituloDoItem } from "@/lib/linha-do-tempo";
import { calcular, haQuanto, STATUS } from "@/lib/metricas";
import { formatarInteiro, formatarPercentual, formatarReal } from "@/lib/numeros";
import type { GrupoEstrategista, ItemPainel } from "@/lib/painel";
import { BotaoCopiar, CartaoComPainel } from "./interacoes";
import { LinhaDoTempo } from "./lancamentos/linha-do-tempo";
import {
  BarraIngressos,
  LinhaMetaCpa,
  SeloFaixa,
  SeloMeta,
} from "./lancamentos/painel-metas";
import { Contagens, CpaDoGrupo, IngressosDoGrupo } from "./visao-geral";

const BOTAO =
  "rounded-lg border border-borda px-3 py-1.5 text-sm hover:border-power";

// Mini gráfico de linha, só para mostrar a direção. Precisa de 2 pontos.
function MiniGrafico({ valores, rotulo }: { valores: number[]; rotulo: string }) {
  if (valores.length < 2) {
    return <p className="mt-2 text-xs text-apagado">Sem histórico para o gráfico ainda</p>;
  }
  const L = 120;
  const A = 28;
  const minimo = Math.min(...valores);
  const faixa = Math.max(...valores) - minimo || 1;
  const pontos = valores.map((valor, i) => [
    (i / (valores.length - 1)) * (L - 6) + 3,
    A - 3 - ((valor - minimo) / faixa) * (A - 6),
  ]);
  const [ultimoX, ultimoY] = pontos[pontos.length - 1];

  return (
    <svg
      viewBox={`0 0 ${L} ${A}`}
      className="mt-2 h-7 w-30 text-apagado"
      role="img"
      aria-label={`${rotulo}: de ${Math.round(valores[0])} para ${Math.round(valores[valores.length - 1])} em ${valores.length} atualizações`}
    >
      <polyline
        points={pontos.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={ultimoX} cy={ultimoY} r="2.5" className="fill-texto" />
    </svg>
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
}: {
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

  return (
    <CartaoComPainel
      titulo={titulo}
      painel={<LinhaDoTempo itens={itens} proximo={proximo} hoje={hoje} quem={quem} />}
      className={`rounded-xl border bg-cartao p-5 hover:border-apagado ${
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

      <div className="mt-4 grid gap-x-6 gap-y-4 border-t border-borda pt-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="flex items-center justify-between gap-2">
            <Rotulo>Ingressos contra a meta</Rotulo>
            <SeloMeta status={urgencia.ingressos.status} />
          </div>
          <p className="mt-0.5 font-semibold">
            {formatarInteiro(urgencia.ingressos.vendidos)}
            {urgencia.ingressos.meta != null
              ? ` de ${formatarInteiro(urgencia.ingressos.meta)}`
              : ""}
            {urgencia.ingressos.meta != null ? (
              <span className="ml-2 text-xs font-normal text-apagado">
                esperado até hoje: {formatarInteiro(urgencia.ingressos.esperado)}
              </span>
            ) : null}
          </p>
          <BarraIngressos urgencia={urgencia} />
          <MiniGrafico valores={item.serieIngressos} rotulo="Ingressos vendidos" />
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <Rotulo>CPA contra a meta</Rotulo>
            <SeloMeta status={urgencia.cpa.status} />
          </div>
          <p className="mt-0.5 font-semibold">
            {formatarReal(urgencia.cpa.atual)}
            {tendencia ? (
              <span className={`ml-2 text-sm ${tendencia.cor}`}>
                <span aria-hidden>{tendencia.icone}</span> {tendencia.texto}
              </span>
            ) : null}
          </p>
          <LinhaMetaCpa urgencia={urgencia} />
          <MiniGrafico valores={item.serieCpa} rotulo="CPA" />
        </div>

        <dl className="grid grid-cols-3 gap-x-4 gap-y-2 self-start sm:col-span-2 lg:col-span-1 lg:grid-cols-1">
          {[
            ["Verba investida", formatarReal(foto?.verba_investida)],
            ["Receita de ingressos", formatarReal(foto?.receita_ingressos)],
            ["Ticket médio", formatarReal(numeros?.ticketMedio)],
          ].map(([rotulo, valor]) => (
            <div key={rotulo} className="lg:flex lg:items-baseline lg:justify-between lg:gap-3">
              <dt className="text-xs text-apagado">{rotulo}</dt>
              <dd className="font-semibold">{valor}</dd>
            </div>
          ))}
          <div className="col-span-3 lg:col-span-1 lg:flex lg:items-baseline lg:justify-between lg:gap-3">
            <dt className="text-xs text-apagado">
              Grupo de WhatsApp (mínimo {formatarPercentual(urgencia.grupo.minimo)})
            </dt>
            <dd className="flex flex-wrap items-baseline gap-x-2 font-semibold">
              {formatarInteiro(urgencia.grupo.pessoas)}
              {urgencia.grupo.proporcao != null
                ? ` (${formatarPercentual(urgencia.grupo.proporcao)})`
                : ""}
              <SeloMeta status={urgencia.grupo.status} />
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 grid gap-x-6 gap-y-4 border-t border-borda pt-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Rotulo>Próximo na linha do tempo</Rotulo>
          {proximo ? (
            <p className="mt-0.5 text-sm">
              {tituloDoItem(proximo)}{" "}
              <span className={CORES[proximo.cor].texto}>
                {formatarData(proximo.data)} · {contagem(proximo.dias)}
              </span>
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-apagado">Nada pela frente</p>
          )}
        </div>
        <div>
          <Rotulo>Checkpoints atrasados</Rotulo>
          {item.atrasados.length ? (
            <ul className="mt-0.5 text-sm">
              {item.atrasados.map((atrasado) => (
                <li key={atrasado.titulo}>
                  {atrasado.titulo}{" "}
                  <span className="text-power-claro">
                    há {atrasado.dias} {atrasado.dias === 1 ? "dia" : "dias"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-0.5 text-sm text-apagado">Nenhum</p>
          )}
        </div>
        <div>
          <Rotulo>Estrategista</Rotulo>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm">
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
          {lancamento.bloqueio ? (
            <p className="mt-1 text-sm">
              <span className="text-apagado">Bloqueio: </span>
              {lancamento.bloqueio}
            </p>
          ) : null}
          {lancamento.proximo_passo ? (
            <p className="mt-1 text-sm">
              <span className="text-apagado">Próximo passo: </span>
              {lancamento.proximo_passo}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {cobranca ? (
          <BotaoCopiar
            texto={cobranca}
            className="rounded-lg bg-power px-4 py-1.5 text-sm font-semibold hover:brightness-125"
          >
            Copiar cobrança
          </BotaoCopiar>
        ) : null}
        <button type="button" data-abre-painel className={BOTAO}>
          Linha do tempo
        </button>
        <Link href={`/lancamentos/${lancamento.id}`} className={BOTAO}>
          {admin ? "Abrir lançamento" : "Atualizar lançamento"}
        </Link>
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
            <Rotulo>Verba investida</Rotulo>
            <p className="mt-0.5 font-semibold">{formatarReal(resumo.verba)}</p>
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

      {problemas.length ? <ol className="mt-6 grid gap-4">{problemas.map(cartao)}</ol> : null}

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
