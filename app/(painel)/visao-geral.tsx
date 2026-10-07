import Link from "next/link";
import { formatarData, hoje } from "@/lib/datas";
import { contagem, CORES, tituloDoItem, type Checkpoint } from "@/lib/linha-do-tempo";
import type { Lancamento } from "@/lib/marcos";
import { haQuanto, STATUS, type Foto } from "@/lib/metricas";
import { formatarInteiro, formatarPercentual, formatarReal } from "@/lib/numeros";
import { obterSessao } from "@/lib/sessao";
import { montarLinha, ordenarPrioridades, type Linha } from "@/lib/visao";
import { FiltrosVisao } from "./filtros-visao";
import { MetaRapida } from "./metas-rapidas";

type Filtros = { modo?: string; estrategista?: string; status?: string; tipo?: string };

function Dado({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-apagado">{rotulo}</p>
      <p className="mt-0.5 text-sm">{children}</p>
    </div>
  );
}

function CartaoLancamento({ linha, mostrarDono }: { linha: Linha; mostrarDono: boolean }) {
  const { lancamento, foto, numeros, proximo } = linha;
  const status = lancamento.status ? STATUS[lancamento.status] : null;

  return (
    <li>
      <Link
        href={`/lancamentos/${lancamento.id}`}
        className="block rounded-xl border border-borda bg-cartao p-4 hover:border-power"
      >
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="flex items-start gap-3">
            <span
              title={status?.rotulo ?? "Sem atualização"}
              className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${
                status?.ponto ?? "border border-apagado"
              }`}
            />
            <div>
              <p className="font-semibold">
                {lancamento.nome}
                <span className="ml-2 rounded-full border border-borda px-2 py-0.5 text-xs font-normal">
                  {lancamento.tipo}
                </span>
              </p>
              <p className="text-sm text-apagado">
                {linha.expert}
                {mostrarDono ? ` · ${linha.estrategista}` : ""}
              </p>
            </div>
          </div>
          <p className={`text-sm ${linha.parado ? "text-power-claro" : "text-apagado"}`}>
            {linha.diasSemAtualizar == null
              ? "Nunca atualizado"
              : `Atualizado ${haQuanto(linha.diasSemAtualizar)}`}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4 lg:grid-cols-8">
          <div className="col-span-2">
            <p className="text-xs text-apagado">Próximo</p>
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
          <Dado rotulo="Atrasados">
            <span className={linha.atrasados ? "font-semibold text-power-claro" : ""}>
              {linha.atrasados}
            </span>
          </Dado>
          <Dado rotulo="Verba">{formatarReal(foto?.verba_investida)}</Dado>
          <Dado rotulo="Ingressos">
            {formatarInteiro(foto?.ingressos_vendidos)}
            {lancamento.meta_ingressos != null
              ? ` de ${formatarInteiro(lancamento.meta_ingressos)}`
              : ""}
          </Dado>
          <Dado rotulo="Grupo WhatsApp">
            {formatarInteiro(foto?.grupo_whatsapp)}
            {numeros?.comparecimento != null
              ? ` (${formatarPercentual(numeros.comparecimento)})`
              : ""}
          </Dado>
          <Dado rotulo="CPA">{formatarReal(numeros?.cpa)}</Dado>
          <Dado rotulo="Ticket médio">{formatarReal(numeros?.ticketMedio)}</Dado>
        </div>
      </Link>
    </li>
  );
}

export async function VisaoGeral({ filtros }: { filtros: Filtros }) {
  const { supabase } = await obterSessao();

  const [{ data: lancs }, { data: estrategistas }, { data: cps }, { data: fotos }] =
    await Promise.all([
      supabase
        .from("lancamentos")
        .select("*, experts(nome, estrategista_id)")
        .eq("situacao", "ativo"),
      supabase
        .from("perfis")
        .select("id, nome")
        .eq("papel", "estrategista")
        .eq("ativo", true)
        .order("nome"),
      supabase
        .from("checkpoints")
        .select("*, lancamentos!inner(situacao)")
        .eq("lancamentos.situacao", "ativo"),
      supabase
        .from("fotos_metricas")
        .select("*, lancamentos!inner(situacao)")
        .eq("lancamentos.situacao", "ativo")
        .order("criado_em", { ascending: false }),
    ]);

  const dia = hoje();
  const nomes = new Map((estrategistas ?? []).map((e) => [e.id as string, e.nome as string]));
  const checkpoints = (cps ?? []) as Checkpoint[];
  // As fotos vêm da mais nova para a mais antiga: a primeira de cada lançamento é a última.
  const ultimaFoto = new Map<string, Foto>();
  for (const foto of (fotos ?? []) as Foto[]) {
    if (!ultimaFoto.has(foto.lancamento_id)) ultimaFoto.set(foto.lancamento_id, foto);
  }

  const todas = (
    (lancs ?? []) as (Lancamento & {
      experts: { nome: string; estrategista_id: string | null };
    })[]
  ).map((lancamento) =>
    montarLinha(
      lancamento,
      lancamento.experts,
      nomes.get(lancamento.experts.estrategista_id ?? "") ?? "Sem responsável",
      checkpoints.filter((c) => c.lancamento_id === lancamento.id),
      ultimaFoto.get(lancamento.id) ?? null,
      dia,
    ),
  );

  const linhas = ordenarPrioridades(
    todas.filter(
      (linha) =>
        (!filtros.estrategista || linha.estrategistaId === filtros.estrategista) &&
        (!filtros.tipo || linha.lancamento.tipo === filtros.tipo) &&
        (!filtros.status || (linha.lancamento.status ?? "sem") === filtros.status),
    ),
  );

  const semMeta = todas
    .filter((l) => l.lancamento.meta_ingressos == null || l.lancamento.meta_cpa == null)
    .sort((a, b) => a.lancamento.d0.localeCompare(b.lancamento.d0));

  const porEstrategista = filtros.modo === "estrategista";
  const resumo = [
    { rotulo: "Lançamentos ativos", valor: todas.length, alerta: false },
    {
      rotulo: "Com checkpoint atrasado",
      valor: todas.filter((l) => l.atrasados > 0).length,
      alerta: true,
    },
    {
      rotulo: "Sem atualização há mais de 7 dias",
      valor: todas.filter((l) => l.parado).length,
      alerta: true,
    },
  ];

  return (
    <>
      <h1 className="text-2xl font-semibold">Visão geral</h1>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {resumo.map((item) => (
          <div key={item.rotulo} className="rounded-xl border border-borda bg-cartao p-5">
            <p className="text-sm text-apagado">{item.rotulo}</p>
            <p
              className={`mt-1 text-2xl font-semibold ${
                item.alerta && item.valor ? "text-power-claro" : ""
              }`}
            >
              {item.valor}
            </p>
          </div>
        ))}
      </div>

      {semMeta.length ? (
        <section className="mt-6 rounded-xl border border-borda bg-cartao p-5">
          <h2 className="font-semibold">
            Sem meta definida
            <span className="ml-2 text-sm font-normal text-apagado">{semMeta.length}</span>
          </h2>
          <p className="mt-1 text-sm text-apagado">
            Preencha a meta de ingressos e a de CPA de cada lançamento ativo. A
            venda de ingressos conta do DV0 (ou DE0) ao D0; para mudar essas
            datas, abra o lançamento e clique em Editar.
          </p>
          <ul className="mt-2 divide-y divide-borda">
            {semMeta.map((linha) => (
              <MetaRapida
                key={linha.lancamento.id}
                id={linha.lancamento.id}
                nome={linha.lancamento.nome}
                dono={`${linha.expert} · ${linha.estrategista} · D0 ${formatarData(linha.lancamento.d0)}`}
                metaIngressos={linha.lancamento.meta_ingressos}
                metaCpa={linha.lancamento.meta_cpa}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <FiltrosVisao
        estrategistas={(estrategistas ?? []).map((e) => ({ valor: e.id, rotulo: e.nome }))}
      />

      {porEstrategista ? (
        <div className="mt-6 grid gap-8">
          {[
            ...(estrategistas ?? []),
            // Lançamento de expert sem responsável não pode sumir do painel.
            ...(linhas.some((l) => !nomes.has(l.estrategistaId ?? ""))
              ? [{ id: null, nome: "Sem responsável" }]
              : []),
          ]
            .filter((e) => !filtros.estrategista || e.id === filtros.estrategista)
            .map((estrategista) => {
              const dele = linhas.filter((l) =>
                estrategista.id
                  ? l.estrategistaId === estrategista.id
                  : !nomes.has(l.estrategistaId ?? ""),
              );
              const experts = [...new Set(dele.map((l) => l.expert))].sort();
              return (
                <section key={estrategista.id ?? "sem"}>
                  <h2 className="text-lg font-semibold">
                    {estrategista.nome}
                    <span className="ml-2 text-sm font-normal text-apagado">
                      {dele.length === 1 ? "1 lançamento" : `${dele.length} lançamentos`}
                    </span>
                  </h2>
                  {experts.length ? (
                    experts.map((expert) => (
                      <div key={expert} className="mt-3">
                        <h3 className="text-sm text-apagado">{expert}</h3>
                        <ul className="mt-2 grid gap-3">
                          {dele
                            .filter((l) => l.expert === expert)
                            .map((linha) => (
                              <CartaoLancamento
                                key={linha.lancamento.id}
                                linha={linha}
                                mostrarDono={false}
                              />
                            ))}
                        </ul>
                      </div>
                    ))
                  ) : (
                    <p className="mt-3 rounded-xl border border-dashed border-borda p-4 text-sm text-apagado">
                      Nenhum lançamento ativo
                      {filtros.status || filtros.tipo ? " com esses filtros" : " cadastrado"}.
                    </p>
                  )}
                </section>
              );
            })}
        </div>
      ) : linhas.length ? (
        <ul className="mt-6 grid gap-3">
          {linhas.map((linha) => (
            <CartaoLancamento key={linha.lancamento.id} linha={linha} mostrarDono />
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-xl border border-borda bg-cartao p-6 text-sm text-apagado">
          Nenhum lançamento ativo com esses filtros.
        </p>
      )}
    </>
  );
}
