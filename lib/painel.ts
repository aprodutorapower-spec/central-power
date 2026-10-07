// Monta o painel do admin a partir dos dados crus: cada lançamento com a sua
// urgência, o resumo de cada estrategista e os totais da operação.
// A conta de status e de urgência é sempre a de lib/urgencia.ts.
//
// Imports com ".ts" pelo mesmo motivo de urgencia.ts: os testes rodam no Node.
import { diasEntre } from "./datas.ts";
import { dividir, formatarPercentual } from "./numeros.ts";
import {
  calcularUrgencia,
  ORDEM_FAIXAS,
  ordenarPorUrgencia,
  TOLERANCIA_META,
  type Faixa,
  type Urgencia,
} from "./urgencia.ts";
import type { Checkpoint } from "./linha-do-tempo";
import type { Lancamento } from "./marcos";
import type { Foto } from "./metricas";

export type LancamentoDoPainel = Lancamento & {
  experts: { nome: string; estrategista_id: string | null };
};

export type ItemPainel = {
  lancamento: LancamentoDoPainel;
  expert: string;
  estrategistaId: string | null;
  // Última foto de métricas e o histórico completo, da mais antiga para a mais nova.
  foto: Foto | null;
  fotos: Foto[];
  checkpoints: Checkpoint[];
  // Checkpoints atrasados, do mais antigo para o mais recente.
  atrasados: { titulo: string; dias: number }[];
  // Evolução para os mini gráficos, uma medida por foto de métricas.
  serieIngressos: number[];
  serieCpa: number[];
  // Para onde o CPA foi da penúltima para a última foto (null = sem histórico).
  tendenciaCpa: "subindo" | "caindo" | "estavel" | null;
  urgencia: Urgencia;
};

// Variação de CPA menor que isso entre duas fotos conta como "estável".
export const VARIACAO_MINIMA_CPA = 0.02;

export type Resumo = ReturnType<typeof resumir>;
export type GrupoEstrategista = {
  id: string | null;
  nome: string;
  itens: ItemPainel[];
  resumo: Resumo;
};

const plural = (n: number, um: string, varios: string) =>
  `${n} ${n === 1 ? um : varios}`;

export function montarItens(dados: {
  lancamentos: LancamentoDoPainel[];
  checkpoints: Checkpoint[];
  fotos: Foto[];
  hoje: string;
}): ItemPainel[] {
  const itens: ItemPainel[] = dados.lancamentos.map((lancamento) => {
    const checkpoints = dados.checkpoints.filter(
      (c) => c.lancamento_id === lancamento.id,
    );
    const fotos = dados.fotos
      .filter((f) => f.lancamento_id === lancamento.id)
      .sort((a, b) => a.criado_em.localeCompare(b.criado_em));
    const foto = fotos.at(-1) ?? null;
    const atrasados = checkpoints
      .filter((c) => c.estado === "pendente" && c.data < dados.hoje)
      .map((c) => ({ titulo: c.titulo, dias: diasEntre(c.data, dados.hoje) }))
      .sort((a, b) => b.dias - a.dias);

    const serieCpa = fotos
      .map((f) => dividir(f.verba_investida, f.ingressos_vendidos))
      .filter((valor) => valor != null);
    const [penultimo, ultimo] = serieCpa.slice(-2);
    const variacao = ultimo != null && penultimo ? (ultimo - penultimo) / penultimo : null;

    return {
      lancamento,
      expert: lancamento.experts.nome,
      estrategistaId: lancamento.experts.estrategista_id,
      foto,
      fotos,
      checkpoints,
      atrasados,
      serieIngressos: fotos
        .map((f) => f.ingressos_vendidos)
        .filter((valor) => valor != null),
      serieCpa,
      tendenciaCpa:
        variacao == null
          ? null
          : variacao > VARIACAO_MINIMA_CPA
            ? ("subindo" as const)
            : variacao < -VARIACAO_MINIMA_CPA
              ? ("caindo" as const)
              : ("estavel" as const),
      urgencia: calcularUrgencia({
        lancamento,
        foto,
        atrasos: atrasados.map((a) => a.dias),
        hoje: dados.hoje,
      }),
    };
  });
  return ordenarPorUrgencia(itens);
}

// Resumo de um conjunto de lançamentos (de um estrategista ou da operação toda).
// Recebe os itens já ordenados do pior para o melhor.
export function resumir(itens: ItemPainel[]) {
  const porFaixa = Object.fromEntries(
    ORDEM_FAIXAS.map((faixa) => [faixa, 0]),
  ) as Record<Faixa, number>;
  for (const item of itens) porFaixa[item.urgencia.faixa] += 1;

  const soma = (valor: (item: ItemPainel) => number | null | undefined) =>
    itens.reduce((total, item) => total + (valor(item) ?? 0), 0);

  // CPA médio ponderado: verba total ÷ ingressos totais, só de quem tem tráfego.
  const comTrafego = itens.filter((item) => !item.lancamento.sem_trafego);
  const verba = comTrafego.reduce((t, i) => t + (i.foto?.verba_investida ?? 0), 0);
  const ingressosComTrafego = comTrafego.reduce(
    (t, i) => t + (i.foto?.ingressos_vendidos ?? 0),
    0,
  );
  const cpa = dividir(verba, ingressosComTrafego);

  // A meta de CPA do grupo é a média das metas em uso (a do lançamento ou o
  // teto de mercado), pesada pelos ingressos vendidos
  // (a mesma balança do CPA médio). Sem venda ainda, vale a média simples.
  const comMetaCpa = comTrafego.filter((item) => item.urgencia.cpa.meta != null);
  const peso = comMetaCpa.reduce((t, i) => t + (i.foto?.ingressos_vendidos ?? 0), 0);
  const metaCpa = !comMetaCpa.length
    ? null
    : peso
      ? comMetaCpa.reduce(
          (t, i) => t + i.urgencia.cpa.meta! * (i.foto?.ingressos_vendidos ?? 0),
          0,
        ) / peso
      : comMetaCpa.reduce((t, i) => t + i.urgencia.cpa.meta!, 0) / comMetaCpa.length;
  const desvioCpa = cpa != null && metaCpa ? (cpa - metaCpa) / metaCpa : null;

  const abaixoIngressos = itens.filter(
    (i) => i.urgencia.ingressos.status === "abaixo",
  ).length;
  const abaixoCpa = itens.filter((i) => i.urgencia.cpa.status === "abaixo").length;

  // "Atualizado há X dias" do lançamento mais defasado.
  const nuncaAtualizados = itens.filter(
    (i) => i.urgencia.diasSemAtualizar == null,
  ).length;
  const maisDefasado = itens.reduce<number | null>(
    (maior, i) =>
      i.urgencia.diasSemAtualizar == null
        ? maior
        : Math.max(maior ?? 0, i.urgencia.diasSemAtualizar),
    null,
  );

  // Urgência do grupo: a do pior lançamento dele.
  const pior = itens[0] ?? null;
  const faixa = ORDEM_FAIXAS.find((f) => porFaixa[f] > 0) ?? null;

  const partes = [plural(itens.length, "lançamento ativo", "lançamentos ativos")];
  if (abaixoIngressos) partes.push(`${abaixoIngressos} abaixo da meta de ingressos`);
  if (desvioCpa != null && desvioCpa > TOLERANCIA_META) {
    partes.push(`CPA ${formatarPercentual(desvioCpa)} acima da meta`);
  } else if (abaixoCpa) partes.push(`${abaixoCpa} com CPA acima da meta`);
  if (porFaixa.sem_dados) partes.push(`${porFaixa.sem_dados} sem dados`);
  if (porFaixa.sem_meta) partes.push(`${porFaixa.sem_meta} sem meta`);
  if (nuncaAtualizados) partes.push(`${nuncaAtualizados} nunca atualizado${nuncaAtualizados > 1 ? "s" : ""}`);
  if (partes.length === 1 && itens.length) partes.push("tudo na meta ou acima");

  return {
    ativos: itens.length,
    porFaixa,
    faixa,
    // Sem lançamento ativo não há o que cobrar: vai para o fim da fila.
    pontos: pior ? pior.urgencia.pontos : -Infinity,
    pior,
    abaixoIngressos,
    abaixoCpa,
    verba,
    ingressos: soma((i) => i.foto?.ingressos_vendidos),
    metaIngressos: soma((i) => i.lancamento.meta_ingressos),
    cpa,
    metaCpa,
    desvioCpa,
    maisDefasado,
    nuncaAtualizados,
    motivo: itens.length ? partes.join(", ") : "Nenhum lançamento ativo",
  };
}

// Precisa de atenção quem tem algo abaixo da meta ou sem dados. "Sem meta" é
// pendência do admin, não do estrategista.
export function precisaDeAtencao(resumo: Resumo) {
  return resumo.faixa === "abaixo" || resumo.faixa === "sem_dados";
}

export function montarPainel(dados: {
  lancamentos: LancamentoDoPainel[];
  estrategistas: { id: string; nome: string }[];
  checkpoints: Checkpoint[];
  fotos: Foto[];
  hoje: string;
}) {
  const itens = montarItens(dados);
  const conhecidos = new Set(dados.estrategistas.map((e) => e.id));
  const orfaos = itens.filter((i) => !conhecidos.has(i.estrategistaId ?? ""));

  const grupos: GrupoEstrategista[] = [
    ...dados.estrategistas.map((estrategista) => {
      const dele = itens.filter((i) => i.estrategistaId === estrategista.id);
      return { ...estrategista, itens: dele, resumo: resumir(dele) };
    }),
    // Lançamento de expert sem responsável não pode sumir do painel.
    ...(orfaos.length
      ? [{ id: null, nome: "Sem responsável", itens: orfaos, resumo: resumir(orfaos) }]
      : []),
  ].sort(
    (a, b) =>
      // Compara antes de subtrair: -Infinity menos -Infinity não é número.
      (a.resumo.pontos === b.resumo.pontos ? 0 : b.resumo.pontos - a.resumo.pontos) ||
      b.resumo.porFaixa.abaixo - a.resumo.porFaixa.abaixo ||
      a.nome.localeCompare(b.nome, "pt-BR"),
  );

  return {
    itens,
    estrategistas: grupos,
    operacao: resumir(itens),
    semMeta: itens
      .filter((i) => i.urgencia.faltaMeta)
      .sort((a, b) => a.lancamento.d0.localeCompare(b.lancamento.d0)),
  };
}
