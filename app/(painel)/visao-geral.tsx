import Link from "next/link";
import { formatarData } from "@/lib/datas";
import { haQuanto } from "@/lib/metricas";
import { formatarInteiro, formatarPercentual, formatarReal } from "@/lib/numeros";
import { precisaDeAtencao, type GrupoEstrategista, type Resumo } from "@/lib/painel";
import {
  FAIXAS,
  LIMITE_SEM_ATUALIZAR_DIAS,
  TOLERANCIA_META,
  type Faixa,
} from "@/lib/urgencia";
import { carregarPainel } from "./dados-painel";
import { LembrarRolagem } from "./interacoes";
import { SeloFaixa } from "./lancamentos/painel-metas";
import { MetaRapida } from "./metas-rapidas";

export function enderecoDoEstrategista(id: string | null) {
  return `/estrategistas/${id ?? "sem-responsavel"}`;
}

// Quantos lançamentos em cada situação. Abaixo, Na meta e Acima aparecem
// sempre; as outras só quando existem.
export function Contagens({ resumo }: { resumo: Resumo }) {
  const sempre: Faixa[] = ["abaixo", "na_meta", "acima"];
  const faixas = (Object.keys(FAIXAS) as Faixa[]).filter(
    (faixa) => sempre.includes(faixa) || resumo.porFaixa[faixa] > 0,
  );
  const curto: Record<Faixa, string> = {
    abaixo: "abaixo",
    sem_dados: "sem dados",
    sem_meta: "sem meta",
    na_meta: "na meta",
    acima: "acima",
    nao_comecou: "sem vendas ainda",
    sem_trafego: "sem tráfego",
  };

  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
      {faixas.map((faixa) => {
        const total = resumo.porFaixa[faixa];
        return (
          <span
            key={faixa}
            className={total ? FAIXAS[faixa].cor : "text-apagado"}
          >
            <span aria-hidden>{FAIXAS[faixa].icone}</span> {total} {curto[faixa]}
          </span>
        );
      })}
    </span>
  );
}

export function Defasagem({ resumo }: { resumo: Resumo }) {
  if (!resumo.ativos) return null;
  if (resumo.nuncaAtualizados) {
    return (
      <span className="text-sm text-power-claro">
        {resumo.nuncaAtualizados === 1
          ? "1 lançamento nunca atualizado"
          : `${resumo.nuncaAtualizados} lançamentos nunca atualizados`}
      </span>
    );
  }
  const dias = resumo.maisDefasado ?? 0;
  return (
    <span
      className={`text-sm ${
        dias > LIMITE_SEM_ATUALIZAR_DIAS ? "text-power-claro" : "text-apagado"
      }`}
    >
      Mais defasado: atualizado {haQuanto(dias)}
    </span>
  );
}

function Dado({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-apagado">{rotulo}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

export function IngressosDoGrupo({ resumo }: { resumo: Resumo }) {
  return (
    <>
      <span className="font-semibold">{formatarInteiro(resumo.ingressos)}</span>
      {resumo.metaIngressos ? (
        <span className="text-apagado"> de {formatarInteiro(resumo.metaIngressos)}</span>
      ) : null}
    </>
  );
}

export function CpaDoGrupo({ resumo }: { resumo: Resumo }) {
  const fora = resumo.desvioCpa != null && resumo.desvioCpa > TOLERANCIA_META;
  return (
    <>
      <span className={`font-semibold ${fora ? "text-power-claro" : ""}`}>
        {formatarReal(resumo.cpa)}
      </span>
      {resumo.metaCpa != null ? (
        <span className="text-apagado">
          {" "}
          · meta {formatarReal(resumo.metaCpa)}
          {fora ? ` (${formatarPercentual(resumo.desvioCpa)} acima)` : ""}
        </span>
      ) : null}
    </>
  );
}

function CartaoEstrategista({ grupo }: { grupo: GrupoEstrategista }) {
  const { resumo } = grupo;
  const pior = resumo.pior;

  return (
    <li>
      <Link
        href={enderecoDoEstrategista(grupo.id)}
        className="block rounded-xl border border-borda bg-cartao p-5 hover:border-power"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="flex flex-wrap items-baseline gap-x-3 text-lg font-semibold">
            {grupo.nome}
            {resumo.faixa ? <SeloFaixa faixa={resumo.faixa} className="text-sm" /> : null}
          </h3>
          <Defasagem resumo={resumo} />
        </div>

        <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1.2fr]">
          <Dado
            rotulo={
              resumo.ativos === 1 ? "1 lançamento ativo" : `${resumo.ativos} lançamentos ativos`
            }
          >
            <Contagens resumo={resumo} />
          </Dado>
          <Dado rotulo="Ingressos vendidos contra a meta">
            <IngressosDoGrupo resumo={resumo} />
          </Dado>
          <Dado rotulo="CPA médio">
            <CpaDoGrupo resumo={resumo} />
          </Dado>
        </div>

        {pior ? (
          <p className="mt-4 border-t border-borda pt-3 text-sm">
            <span className="text-apagado">Pior lançamento: </span>
            <span className="font-semibold">
              {pior.expert} · {pior.lancamento.nome}
            </span>
            <span className="text-apagado"> — </span>
            {pior.urgencia.motivo}
          </p>
        ) : null}
      </Link>
    </li>
  );
}

// Quem está bem ocupa uma linha só: acessível, mas sem competir por atenção.
function LinhaEstrategista({ grupo }: { grupo: GrupoEstrategista }) {
  const { resumo } = grupo;
  return (
    <li>
      <Link
        href={enderecoDoEstrategista(grupo.id)}
        className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-5 py-3 hover:bg-cartao-2"
      >
        <span className="flex flex-wrap items-baseline gap-x-3">
          <span className="font-semibold">{grupo.nome}</span>
          {resumo.faixa ? (
            <SeloFaixa faixa={resumo.faixa} className="text-sm" />
          ) : (
            <span className="text-sm text-apagado">Nenhum lançamento ativo</span>
          )}
        </span>
        {resumo.ativos ? (
          <span className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm">
            <span className="text-apagado">
              {resumo.ativos === 1 ? "1 ativo" : `${resumo.ativos} ativos`}
            </span>
            <span>
              <span className="text-apagado">Ingressos </span>
              <IngressosDoGrupo resumo={resumo} />
            </span>
            <span>
              <span className="text-apagado">CPA </span>
              <CpaDoGrupo resumo={resumo} />
            </span>
            <Defasagem resumo={resumo} />
          </span>
        ) : null}
      </Link>
    </li>
  );
}

export async function VisaoGeral() {
  const { hoje, estrategistas, operacao, semMeta } = await carregarPainel();

  const urgentes = estrategistas.filter((grupo) => precisaDeAtencao(grupo.resumo));
  const emDia = estrategistas.filter((grupo) => !precisaDeAtencao(grupo.resumo));
  const primeiro = urgentes[0];

  return (
    <>
      <LembrarRolagem />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">Visão geral</h1>
        <p className="text-sm text-apagado">Hoje, {formatarData(hoje)}</p>
      </div>

      <section
        aria-label="Onde começar"
        className={`mt-6 rounded-xl border p-5 sm:p-6 ${
          primeiro ? "border-power bg-cartao" : "border-borda bg-cartao"
        }`}
      >
        <p className="text-sm text-apagado">Onde começar</p>
        {primeiro ? (
          <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-semibold">{primeiro.nome}</p>
              <p className="mt-1">{primeiro.resumo.motivo}.</p>
            </div>
            <Link
              href={enderecoDoEstrategista(primeiro.id)}
              className="rounded-lg bg-power px-5 py-2.5 font-semibold hover:brightness-125"
            >
              Abrir {primeiro.nome} →
            </Link>
          </div>
        ) : (
          <p className="mt-1 text-lg font-semibold">
            {operacao.ativos
              ? "Nenhum lançamento abaixo da meta hoje."
              : "Nenhum lançamento ativo cadastrado."}
            {semMeta.length ? (
              <a href="#sem-meta" className="ml-2 text-sm font-normal text-apagado underline hover:text-texto">
                {semMeta.length === 1
                  ? "1 lançamento ainda sem meta"
                  : `${semMeta.length} lançamentos ainda sem meta`}
              </a>
            ) : null}
          </p>
        )}
      </section>

      <section
        aria-label="Operação toda"
        className="mt-3 grid gap-x-6 gap-y-3 rounded-xl border border-borda bg-cartao px-5 py-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]"
      >
        <Dado
          rotulo={
            operacao.ativos === 1
              ? "Operação: 1 lançamento ativo"
              : `Operação: ${operacao.ativos} lançamentos ativos`
          }
        >
          <Contagens resumo={operacao} />
        </Dado>
        <Dado rotulo="Verba investida">
          <span className="font-semibold">{formatarReal(operacao.verba)}</span>
        </Dado>
        <Dado rotulo="Ingressos vendidos contra a meta">
          <IngressosDoGrupo resumo={operacao} />
        </Dado>
        <Dado rotulo="CPA médio">
          <CpaDoGrupo resumo={operacao} />
        </Dado>
      </section>

      {urgentes.length ? (
        <section className="mt-8">
          <h2 className="font-semibold">
            Precisam de atenção
            <span className="ml-2 text-sm font-normal text-apagado">
              do pior para o melhor
            </span>
          </h2>
          <ol className="mt-3 grid gap-3">
            {urgentes.map((grupo) => (
              <CartaoEstrategista key={grupo.id ?? "sem"} grupo={grupo} />
            ))}
          </ol>
        </section>
      ) : null}

      {emDia.length ? (
        <section className="mt-8">
          <h2 className="font-semibold">
            {urgentes.length ? "Sem nada abaixo da meta" : "Estrategistas"}
            <span className="ml-2 text-sm font-normal text-apagado">{emDia.length}</span>
          </h2>
          <ul className="mt-3 divide-y divide-borda overflow-hidden rounded-xl border border-borda bg-cartao">
            {emDia.map((grupo) => (
              <LinhaEstrategista key={grupo.id ?? "sem"} grupo={grupo} />
            ))}
          </ul>
        </section>
      ) : null}

      {semMeta.length ? (
        <section id="sem-meta" className="mt-8 scroll-mt-6">
          <h2 className="font-semibold text-apagado">
            Sem meta definida
            <span className="ml-2 text-sm font-normal">{semMeta.length}</span>
          </h2>
          <p className="mt-1 text-sm text-apagado">
            Com o ticket do ingresso preenchido, a meta de CPA pode ficar em branco:
            vale o dobro do ticket. Se houver mais de um preço, use o ticket médio.
          </p>
          <ul className="mt-3 divide-y divide-borda rounded-xl border border-borda bg-cartao px-5">
            {semMeta.map((item) => (
              <MetaRapida
                key={item.lancamento.id}
                id={item.lancamento.id}
                nome={item.lancamento.nome}
                dono={`${item.expert} · D0 ${formatarData(item.lancamento.d0)}`}
                metaIngressos={item.lancamento.meta_ingressos}
                metaCpa={item.lancamento.meta_cpa}
                ticket={item.lancamento.ticket_ingresso}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
