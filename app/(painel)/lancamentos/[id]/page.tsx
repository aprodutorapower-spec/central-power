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
import { calcular, haQuanto, STATUS, type Foto } from "@/lib/metricas";
import { formatarInteiro, formatarPercentual, formatarReal } from "@/lib/numeros";
import { obterSessao } from "@/lib/sessao";
import { definirSituacao } from "../actions";
import { CartaoCheckpoint } from "./cartao-checkpoint";
import { FormAtualizacao } from "./form-atualizacao";

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs text-apagado">{rotulo}</p>
      <p className="mt-0.5 font-semibold">{valor}</p>
    </div>
  );
}

export default async function LancamentoPage({
  params,
}: PageProps<"/lancamentos/[id]">) {
  const { id } = await params;
  const { supabase, perfil } = await obterSessao();

  const [{ data }, { data: lista }, { data: historico }] = await Promise.all([
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
  ]);
  if (!data) notFound();

  const lancamento = data as Lancamento & { experts: { nome: string } };
  const fotos = (historico ?? []) as Foto[];
  const ultima = fotos[0] ?? null;
  const dia = hoje();
  const fase = faseDoLancamento(lancamento, dia);
  const encerrado = lancamento.situacao === "encerrado";
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
              ? ` · meta de ${formatarInteiro(lancamento.meta_ingressos)} ingressos`
              : ""}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-sm ${fase.cor}`}>
          {fase.rotulo}
        </span>
      </div>

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

        {ultima && numeros ? (
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-borda pt-4 sm:grid-cols-3 lg:grid-cols-6">
            <Numero rotulo="Verba investida" valor={formatarReal(ultima.verba_investida)} />
            <Numero
              rotulo="Ingressos vendidos"
              valor={
                formatarInteiro(ultima.ingressos_vendidos) +
                (lancamento.meta_ingressos != null
                  ? ` de ${formatarInteiro(lancamento.meta_ingressos)}`
                  : "")
              }
            />
            <Numero rotulo="Receita de ingressos" valor={formatarReal(ultima.receita_ingressos)} />
            <Numero
              rotulo="No grupo de WhatsApp"
              valor={
                formatarInteiro(ultima.grupo_whatsapp) +
                (numeros.comparecimento != null
                  ? ` (${formatarPercentual(numeros.comparecimento)})`
                  : "")
              }
            />
            <Numero rotulo="CPA" valor={formatarReal(numeros.cpa)} />
            <Numero rotulo="Ticket médio" valor={formatarReal(numeros.ticketMedio)} />
          </div>
        ) : null}

        <details className="mt-4 border-t border-borda pt-4" open={!status}>
          <summary className="cursor-pointer list-none">
            <span className="inline-block rounded-lg bg-power px-4 py-2 font-semibold hover:brightness-125">
              Atualizar lançamento
            </span>
          </summary>
          <FormAtualizacao lancamento={lancamento} ultima={ultima} />
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
        <ol className="mt-3 border-l border-borda">
          {itens.map((item) =>
            item.tipo === "checkpoint" ? (
              <CartaoCheckpoint
                key={item.chave}
                checkpoint={item.checkpoint}
                hoje={dia}
                proximo={item === proximo}
                quem={perfil?.nome ?? ""}
              />
            ) : (
              <li key={item.chave} className="relative pb-4 pl-6">
                <span className="absolute -left-[5px] top-3.5 h-2.5 w-2.5 rounded-full bg-borda" />
                <div
                  className={`flex flex-wrap items-baseline justify-between gap-x-3 rounded-lg px-4 py-2 text-sm ${
                    item === proximo ? "border border-power" : ""
                  } ${item.dias < 0 ? "text-apagado" : ""}`}
                >
                  <span>
                    <span className="font-semibold">{item.sigla}</span> · {item.titulo}
                  </span>
                  <span>
                    {formatarData(item.data)}
                    <span className="ml-2 text-apagado">{contagem(item.dias)}</span>
                  </span>
                </div>
              </li>
            ),
          )}
        </ol>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">Histórico de métricas</h2>
        {fotos.length ? (
          <div className="mt-3 overflow-x-auto rounded-xl border border-borda bg-cartao">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs text-apagado">
                <tr>
                  {["Data", "Quem", "Verba", "Ingressos", "Receita", "Grupo WhatsApp", "CPA", "Ticket médio"].map(
                    (coluna) => (
                      <th key={coluna} className="px-4 py-3 font-normal">
                        {coluna}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {fotos.map((foto) => {
                  const calculo = calcular(foto);
                  return (
                    <tr key={foto.id}>
                      <td className="px-4 py-3">{formatarData(foto.data)}</td>
                      <td className="px-4 py-3">
                        {foto.preenchido_por_nome ?? "—"}
                        {foto.fonte !== "manual" ? ` (${foto.fonte})` : ""}
                      </td>
                      <td className="px-4 py-3">{formatarReal(foto.verba_investida)}</td>
                      <td className="px-4 py-3">{formatarInteiro(foto.ingressos_vendidos)}</td>
                      <td className="px-4 py-3">{formatarReal(foto.receita_ingressos)}</td>
                      <td className="px-4 py-3">
                        {formatarInteiro(foto.grupo_whatsapp)}
                        {calculo.comparecimento != null
                          ? ` (${formatarPercentual(calculo.comparecimento)})`
                          : ""}
                      </td>
                      <td className="px-4 py-3">{formatarReal(calculo.cpa)}</td>
                      <td className="px-4 py-3">{formatarReal(calculo.ticketMedio)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 rounded-xl border border-borda bg-cartao p-5 text-sm text-apagado">
            Nenhuma foto de métricas ainda. Ela nasce a cada atualização do lançamento.
          </p>
        )}
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link
          href={`/lancamentos/${lancamento.id}/editar`}
          className="rounded-lg border border-borda px-4 py-2 hover:border-power"
        >
          Editar lançamento
        </Link>
        <Link
          href={`/experts/${lancamento.expert_id}/berry`}
          className="rounded-lg border border-borda px-4 py-2 hover:border-power"
        >
          {lancamento.berry_produto_nome
            ? `Berry: ${lancamento.berry_produto_nome}`
            : "Conectar Berry"}
        </Link>
        <form action={definirSituacao}>
          <input type="hidden" name="id" value={lancamento.id} />
          <input type="hidden" name="situacao" value={encerrado ? "ativo" : "encerrado"} />
          <BotaoEnviar className="text-sm text-apagado hover:text-texto">
            {encerrado ? "Reabrir lançamento" : "Encerrar lançamento"}
          </BotaoEnviar>
        </form>
      </div>
    </>
  );
}
