import Link from "next/link";
import { notFound } from "next/navigation";
import { formatarData, hoje } from "@/lib/datas";
import {
  contagem,
  montarLinhaDoTempo,
  tituloDoItem,
  type Checkpoint,
  type Cor,
  type ItemLinha,
} from "@/lib/linha-do-tempo";
import { faseDoLancamento, TIPOS, type Lancamento } from "@/lib/marcos";
import { obterSessao } from "@/lib/sessao";
import {
  definirDataCheckpoint,
  definirEstadoCheckpoint,
  definirSituacao,
} from "../actions";

const CORES: Record<Cor, { ponto: string; texto: string; rotulo: string }> = {
  em_dia: { ponto: "bg-ok", texto: "text-ok", rotulo: "Em dia" },
  perto: { ponto: "bg-atencao", texto: "text-atencao", rotulo: "Perto" },
  atrasado: { ponto: "bg-power-claro", texto: "text-power-claro", rotulo: "Atrasado" },
  neutro: { ponto: "bg-borda", texto: "text-apagado", rotulo: "" },
};

const BOTAO =
  "rounded-lg border border-borda px-3 py-1.5 text-sm hover:border-power-claro";

function BotaoEstado({
  id,
  estado,
  children,
  destaque,
}: {
  id: string;
  estado: Checkpoint["estado"];
  children: React.ReactNode;
  destaque?: boolean;
}) {
  return (
    <form action={definirEstadoCheckpoint}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="estado" value={estado} />
      <button
        type="submit"
        className={
          destaque
            ? "rounded-lg bg-power px-3 py-1.5 text-sm font-semibold hover:bg-power-claro"
            : BOTAO
        }
      >
        {children}
      </button>
    </form>
  );
}

function LinhaCheckpoint({ item }: { item: ItemLinha & { tipo: "checkpoint" } }) {
  const { checkpoint } = item;
  const cor = CORES[item.cor];
  const pendente = checkpoint.estado === "pendente";

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span
          className={`font-semibold ${
            checkpoint.estado === "nao_se_aplica" ? "text-apagado line-through" : ""
          }`}
        >
          {checkpoint.titulo}
        </span>
        <span className="text-sm">
          {formatarData(checkpoint.data)}
          {pendente ? (
            <span className={`ml-2 ${cor.texto}`}>{contagem(item.dias)}</span>
          ) : null}
        </span>
      </div>
      {checkpoint.descricao ? (
        <p className="mt-1 text-sm text-apagado">{checkpoint.descricao}</p>
      ) : null}
      {checkpoint.estado === "feito" ? (
        <p className="mt-1 text-sm text-ok">
          Feito
          {checkpoint.feito_em
            ? ` em ${formatarData(
                new Intl.DateTimeFormat("en-CA", {
                  timeZone: "America/Sao_Paulo",
                }).format(new Date(checkpoint.feito_em)),
              )}`
            : ""}
          {checkpoint.feito_por_nome ? ` por ${checkpoint.feito_por_nome}` : ""}
        </p>
      ) : null}
      {checkpoint.estado === "nao_se_aplica" ? (
        <p className="mt-1 text-sm text-apagado">Não se aplica</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {pendente ? (
          <BotaoEstado id={checkpoint.id} estado="feito" destaque>
            Marcar como feito
          </BotaoEstado>
        ) : (
          <BotaoEstado id={checkpoint.id} estado="pendente">
            Voltar para pendente
          </BotaoEstado>
        )}
        <details className="group">
          <summary className={`cursor-pointer list-none ${BOTAO}`}>
            Mais opções
          </summary>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <form action={definirDataCheckpoint} className="flex items-end gap-2">
              <input type="hidden" name="id" value={checkpoint.id} />
              <label className="text-xs text-apagado">
                Nova data
                <input
                  type="date"
                  name="data"
                  required
                  defaultValue={checkpoint.data}
                  className="mt-1 block rounded-lg border border-borda bg-cartao-2 px-2 py-1.5 text-sm text-texto outline-none focus:border-power-claro"
                />
              </label>
              <button type="submit" className={BOTAO}>
                Salvar data
              </button>
            </form>
            {checkpoint.estado !== "nao_se_aplica" ? (
              <BotaoEstado id={checkpoint.id} estado="nao_se_aplica">
                Não se aplica
              </BotaoEstado>
            ) : null}
          </div>
        </details>
      </div>
    </>
  );
}

export default async function LancamentoPage({
  params,
}: PageProps<"/lancamentos/[id]">) {
  const { id } = await params;
  const { supabase } = await obterSessao();

  const [{ data }, { data: lista }] = await Promise.all([
    supabase
      .from("lancamentos")
      .select("*, experts(nome)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("checkpoints").select("*").eq("lancamento_id", id),
  ]);
  if (!data) notFound();

  const lancamento = data as Lancamento & { experts: { nome: string } };
  const dia = hoje();
  const fase = faseDoLancamento(lancamento, dia);
  const encerrado = lancamento.situacao === "encerrado";
  const { itens, proximo, atrasados } = montarLinhaDoTempo(
    lancamento,
    (lista ?? []) as Checkpoint[],
    dia,
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
              ? ` · meta de ${lancamento.meta_ingressos} ingressos`
              : ""}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-sm ${fase.cor}`}>
          {fase.rotulo}
        </span>
      </div>

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
        <ol className="mt-3 border-l border-borda">
          {itens.map((item) => {
            const cor = CORES[item.cor];
            const ehProximo = item === proximo;
            return (
              <li key={item.chave} className="relative pb-4 pl-6">
                <span
                  className={`absolute -left-[5px] top-5 h-2.5 w-2.5 rounded-full ${cor.ponto}`}
                />
                {item.tipo === "marco" ? (
                  <div
                    className={`flex flex-wrap items-baseline justify-between gap-x-3 rounded-lg px-4 py-2 text-sm ${
                      ehProximo ? "border border-power-claro" : ""
                    } ${item.dias < 0 ? "text-apagado" : ""}`}
                  >
                    <span>
                      <span className="font-semibold">{item.sigla}</span> ·{" "}
                      {item.titulo}
                    </span>
                    <span>
                      {formatarData(item.data)}
                      <span className="ml-2 text-apagado">{contagem(item.dias)}</span>
                    </span>
                  </div>
                ) : (
                  <div
                    className={`rounded-xl border bg-cartao p-4 ${
                      ehProximo ? "border-power-claro" : "border-borda"
                    }`}
                  >
                    {ehProximo ? (
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-power-claro">
                        Próximo
                      </p>
                    ) : null}
                    <LinhaCheckpoint item={item} />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Link href={`/lancamentos/${lancamento.id}/editar`} className={BOTAO}>
          Editar lançamento
        </Link>
        <form action={definirSituacao}>
          <input type="hidden" name="id" value={lancamento.id} />
          <input
            type="hidden"
            name="situacao"
            value={encerrado ? "ativo" : "encerrado"}
          />
          <button type="submit" className="text-sm text-apagado hover:text-texto">
            {encerrado ? "Reabrir lançamento" : "Encerrar lançamento"}
          </button>
        </form>
      </div>
    </>
  );
}
