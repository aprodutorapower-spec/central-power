// Status de meta e urgência de um lançamento. Toda tela usa ESTA função:
// nenhuma recalcula status ou ordem por conta própria.
//
// Os imports têm ".ts" no final para os testes rodarem direto no Node
// (npm test), sem ferramenta extra.
import { diaDe, diasEntre, formatarData } from "./datas.ts";
import { dividir, formatarInteiro, formatarReal } from "./numeros.ts";
import type { Lancamento } from "./marcos";
import type { Foto } from "./metricas";

// Margem em volta da meta: até 10% para cima ou para baixo conta como "Na meta".
export const TOLERANCIA_META = 0.1;
// Réguas de mercado (Ricardo, 07/10/2026):
// o grupo de WhatsApp precisa ter pelo menos 95% de quem comprou ingresso...
export const MINIMO_GRUPO_WHATSAPP = 0.95;
// ...e o CPA pode ser no máximo o dobro do ticket do ingresso. Esse teto só
// vale quando o lançamento não tem meta de CPA cadastrada: havendo meta, ela
// é a regra. O ticket não é digitado no cadastro (Ricardo, 08/10/2026): é o
// ticket médio real, receita ÷ ingressos, que chega com as vendas (Berry).
export const MULTIPLO_TETO_CPA = 2;
// Passou disso sem atualização do estrategista, a tela destaca.
export const LIMITE_SEM_ATUALIZAR_DIAS = 7;

// --- Pesos da urgência (quanto maior a soma, mais urgente) ---
// Critérios principais: ingressos, CPA e grupo de WhatsApp.
export const PESO_ABAIXO = 1000; // cada critério principal abaixo da meta
export const PESO_ABAIXO_NOS_DOIS = 500; // extra por critério abaixo além do primeiro
export const PESO_DESVIO = 400; // × tamanho do desvio (0 a 1) × proximidade do D0 (1 a 2)
// A partir de quantos dias do D0 o mesmo desvio começa a pesar mais.
export const DIAS_PROXIMIDADE_D0 = 14;
// Pendências: ficam logo abaixo de quem está Abaixo e acima de quem está bem.
export const PESO_SEM_DADOS = 650; // vendas já começaram e não há métricas
export const PESO_SEM_META = 600; // falta o admin definir as metas
export const PESO_ACIMA = -50; // acima da meta vai para o fim da fila
// Desempates. Somados chegam no máximo a 240: nunca passam um critério principal.
export const PESO_DIA_DE_ATRASO = 10; // por dia de atraso de cada checkpoint
export const TETO_ATRASOS = 120;
export const PESO_DIA_SEM_ATUALIZAR = 5; // por dia sem atualização do estrategista
export const TETO_SEM_ATUALIZAR = 80; // "nunca atualizado" vale o teto
export const PESO_STATUS_VERMELHO = 40; // estrategista marcou "Em risco"
export const PESO_STATUS_AMARELO = 15; // estrategista marcou "Atenção"

// Situação geral do lançamento frente às metas.
export type Faixa =
  | "abaixo"
  | "sem_dados"
  | "sem_meta"
  | "na_meta"
  | "acima"
  | "nao_comecou"
  | "sem_trafego";
// Situação de cada critério. "acima" é sempre o lado bom (no CPA, gastar menos).
export type StatusMeta =
  | "abaixo"
  | "na_meta"
  | "acima"
  | "sem_meta"
  | "sem_dado"
  | "nao_comecou"
  | "nao_se_aplica";

// Cor, ícone e texto andam sempre juntos (nunca só a cor). Fica aqui, e não
// num componente de tela, porque servidor e navegador usam.
export const FAIXAS: Record<Faixa, { rotulo: string; icone: string; cor: string }> = {
  abaixo: { rotulo: "Abaixo da meta", icone: "▼", cor: "text-power-claro" },
  sem_dados: { rotulo: "Sem dados", icone: "?", cor: "text-atencao" },
  sem_meta: { rotulo: "Sem meta", icone: "○", cor: "text-apagado" },
  na_meta: { rotulo: "Na meta", icone: "●", cor: "text-texto" },
  acima: { rotulo: "Acima da meta", icone: "▲", cor: "text-ok" },
  // Vendas de ingressos ainda não começaram e não há métricas: nada a cobrar.
  nao_comecou: { rotulo: "Vendas não começaram", icone: "○", cor: "text-apagado" },
  // Sem tráfego pago e sem meta de ingressos: fora da avaliação de metas.
  sem_trafego: { rotulo: "Sem tráfego pago", icone: "–", cor: "text-apagado" },
};

// Do pior para o melhor: a situação de um grupo é a primeira que aparecer nele.
export const ORDEM_FAIXAS: Faixa[] = [
  "abaixo",
  "sem_dados",
  "sem_meta",
  "na_meta",
  "acima",
  "nao_comecou",
  "sem_trafego",
];

export const STATUS_META: Record<
  StatusMeta,
  { rotulo: string; icone: string; cor: string }
> = {
  abaixo: { rotulo: "Abaixo", icone: "▼", cor: "text-power-claro" },
  na_meta: { rotulo: "Na meta", icone: "●", cor: "text-texto" },
  acima: { rotulo: "Acima", icone: "▲", cor: "text-ok" },
  sem_meta: { rotulo: "Sem meta", icone: "○", cor: "text-apagado" },
  sem_dado: { rotulo: "Sem dado", icone: "?", cor: "text-apagado" },
  nao_comecou: { rotulo: "Vendas não começaram", icone: "○", cor: "text-apagado" },
  nao_se_aplica: { rotulo: "Sem tráfego pago", icone: "–", cor: "text-apagado" },
};

export type EntradaUrgencia = {
  lancamento: Pick<
    Lancamento,
    | "meta_ingressos"
    | "meta_cpa"
    | "ticket_ingresso"
    | "inicio_vendas"
    | "fim_vendas"
    | "sem_trafego"
    | "dv0"
    | "de0"
    | "d0"
    | "status"
    | "status_atualizado_em"
  >;
  // Última foto de métricas (null = nenhuma ainda).
  foto:
    | (Pick<Foto, "verba_investida" | "ingressos_vendidos"> & {
        receita_ingressos?: number | null;
        grupo_whatsapp?: number | null;
      })
    | null;
  // Dias de atraso de cada checkpoint atrasado.
  atrasos: number[];
  hoje: string;
};

export type Urgencia = ReturnType<typeof calcularUrgencia>;

const limitar = (valor: number, minimo: number, maximo: number) =>
  Math.min(Math.max(valor, minimo), maximo);
const pct = (valor: number) => `${Math.round(Math.abs(valor) * 100)}%`;

// Janela de venda de ingressos: do DV0 (ou DE0, se não houver DV0) ao D0,
// a não ser que o admin tenha informado outras datas.
export function janelaDeVendas(
  l: Pick<Lancamento, "inicio_vendas" | "fim_vendas" | "dv0" | "de0" | "d0">,
) {
  return { inicio: l.inicio_vendas ?? l.dv0 ?? l.de0, fim: l.fim_vendas ?? l.d0 };
}

// O estrategista define as metas ao criar o lançamento e pode corrigir até o
// início das vendas de ingressos; daí em diante só o admin altera. (O banco
// aplica a mesma regra; isto serve para a tela mostrar ou não os campos.)
export function metasFechadasParaEstrategista(
  l: Pick<
    Lancamento,
    "inicio_vendas" | "fim_vendas" | "dv0" | "de0" | "d0" | "metas_travadas"
  >,
  hoje: string,
) {
  return l.metas_travadas || hoje >= janelaDeVendas(l).inicio;
}

export function calcularUrgencia({ lancamento: l, foto, atrasos, hoje }: EntradaUrgencia) {
  // Ritmo esperado: linear do início ao fim das vendas.
  const { inicio, fim } = janelaDeVendas(l);
  const diasTotais = Math.max(diasEntre(inicio, fim), 0);
  const diasDecorridos = limitar(diasEntre(inicio, hoje), 0, diasTotais);
  const fracao = diasTotais ? diasDecorridos / diasTotais : hoje >= fim ? 1 : 0;
  const vendasComecaram = diasEntre(inicio, hoje) >= 0;

  const vendidos = foto?.ingressos_vendidos ?? null;
  const esperado = l.meta_ingressos == null ? null : l.meta_ingressos * fracao;

  let statusIngressos: StatusMeta;
  if (esperado == null) statusIngressos = "sem_meta";
  else if (esperado === 0) statusIngressos = "nao_comecou";
  else if (vendidos == null) statusIngressos = "sem_dado";
  else if (vendidos >= esperado * (1 + TOLERANCIA_META)) statusIngressos = "acima";
  else if (vendidos >= esperado * (1 - TOLERANCIA_META)) statusIngressos = "na_meta";
  else statusIngressos = "abaixo";

  // CPA: menor é melhor. Sem ingresso vendido não há CPA, e isso não pune.
  const cpaAtual = dividir(foto?.verba_investida, vendidos);
  // Com meta de CPA cadastrada, ela é a regra. Sem ela, vale o teto de mercado
  // (o dobro do ticket), que é um máximo: não tem a margem de 10% para cima.
  // O ticket é o médio real das vendas; o do cadastro (lançamentos antigos)
  // só vale enquanto não há receita registrada.
  const ticket =
    (dividir(foto?.receita_ingressos, vendidos) || null) ?? l.ticket_ingresso;
  const tetoCpa = ticket == null ? null : ticket * MULTIPLO_TETO_CPA;
  const metaCpa = l.sem_trafego ? null : (l.meta_cpa ?? tetoCpa);
  const origemMetaCpa =
    metaCpa == null ? null : l.meta_cpa != null ? ("lancamento" as const) : ("mercado" as const);
  const margemCpa = origemMetaCpa === "lancamento" ? TOLERANCIA_META : 0;

  let statusCpa: StatusMeta;
  if (l.sem_trafego) statusCpa = "nao_se_aplica";
  else if (cpaAtual == null) statusCpa = "sem_dado";
  else if (metaCpa == null) statusCpa = "sem_meta";
  else if (cpaAtual <= metaCpa * (1 - TOLERANCIA_META)) statusCpa = "acima";
  else if (cpaAtual <= metaCpa * (1 + margemCpa)) statusCpa = "na_meta";
  else statusCpa = "abaixo";

  // Grupo de WhatsApp: pelo menos 95% de quem comprou ingresso.
  const noGrupo = foto?.grupo_whatsapp ?? null;
  const proporcaoGrupo = dividir(noGrupo, vendidos);
  const statusGrupo: StatusMeta =
    proporcaoGrupo == null
      ? "sem_dado"
      : proporcaoGrupo >= MINIMO_GRUPO_WHATSAPP
        ? "na_meta"
        : "abaixo";

  const desvioGrupo =
    proporcaoGrupo == null
      ? null
      : (proporcaoGrupo - MINIMO_GRUPO_WHATSAPP) / MINIMO_GRUPO_WHATSAPP;

  // Desvios com sinal: negativo em ingressos e grupo, positivo em CPA, são os lados ruins.
  const desvioIngressos =
    esperado && vendidos != null ? (vendidos - esperado) / esperado : null;
  const desvioCpa =
    metaCpa && cpaAtual != null ? (cpaAtual - metaCpa) / metaCpa : null;

  // Sem tráfego pago não se cobra CPA; a meta de ingressos passa a ser opcional.
  const foraDasMetas = l.sem_trafego && l.meta_ingressos == null;
  const semMeta = !l.sem_trafego && l.meta_ingressos == null && metaCpa == null;
  const semDados = vendidos == null;
  // O grupo de WhatsApp conta como critério principal: abaixo de 95%, o
  // lançamento fica "Abaixo da meta" mesmo com ingressos e CPA em ordem.
  const abaixo = [statusIngressos, statusCpa, statusGrupo].filter(
    (s) => s === "abaixo",
  ).length;
  const avaliados = [statusIngressos, statusCpa].filter(
    (s) => s === "acima" || s === "na_meta",
  );

  let faixa: Faixa;
  if (foraDasMetas) faixa = "sem_trafego";
  else if (semMeta) faixa = "sem_meta";
  else if (semDados) faixa = vendasComecaram ? "sem_dados" : "nao_comecou";
  else if (abaixo) faixa = "abaixo";
  else if (avaliados.length && avaliados.every((s) => s === "acima")) faixa = "acima";
  else faixa = "na_meta";

  const diasAteD0 = diasEntre(hoje, l.d0);
  // 1 quando o D0 está longe; cresce até 2 conforme ele chega (e depois dele).
  const proximidade =
    1 + limitar((DIAS_PROXIMIDADE_D0 - diasAteD0) / DIAS_PROXIMIDADE_D0, 0, 1);
  const diasSemAtualizar = l.status_atualizado_em
    ? diasEntre(diaDe(l.status_atualizado_em), hoje)
    : null;
  const maiorAtraso = atrasos.length ? Math.max(...atrasos) : 0;

  let pontos = 0;
  if (faixa === "abaixo") {
    pontos += abaixo * PESO_ABAIXO + (abaixo - 1) * PESO_ABAIXO_NOS_DOIS;
    if (statusIngressos === "abaixo") {
      pontos += PESO_DESVIO * limitar(-desvioIngressos!, 0, 1) * proximidade;
    }
    if (statusCpa === "abaixo") {
      pontos += PESO_DESVIO * limitar(desvioCpa!, 0, 1) * proximidade;
    }
    if (statusGrupo === "abaixo") {
      pontos += PESO_DESVIO * limitar(-desvioGrupo!, 0, 1) * proximidade;
    }
  } else if (faixa === "sem_meta") pontos += PESO_SEM_META;
  else if (faixa === "sem_dados") pontos += PESO_SEM_DADOS;
  else if (faixa === "acima") pontos += PESO_ACIMA;

  pontos += Math.min(
    atrasos.reduce((soma, dias) => soma + dias * PESO_DIA_DE_ATRASO, 0),
    TETO_ATRASOS,
  );
  pontos +=
    diasSemAtualizar == null
      ? TETO_SEM_ATUALIZAR
      : Math.min(diasSemAtualizar * PESO_DIA_SEM_ATUALIZAR, TETO_SEM_ATUALIZAR);
  if (l.status === "vermelho") pontos += PESO_STATUS_VERMELHO;
  if (l.status === "amarelo") pontos += PESO_STATUS_AMARELO;

  // Motivo em frases curtas, do mais grave para o menos grave.
  const motivos: string[] = [];
  if (statusIngressos === "abaixo") {
    motivos.push(
      `Ingressos ${pct(desvioIngressos!)} abaixo do ritmo (${formatarInteiro(vendidos)} de ${formatarInteiro(Math.round(esperado!))} esperados até hoje)`,
    );
  }
  if (statusCpa === "abaixo") {
    motivos.push(
      origemMetaCpa === "mercado"
        ? `CPA ${pct(desvioCpa!)} acima do dobro do ticket (${formatarReal(cpaAtual)} contra teto de ${formatarReal(metaCpa)})`
        : `CPA ${pct(desvioCpa!)} acima da meta (${formatarReal(cpaAtual)} contra ${formatarReal(metaCpa)})`,
    );
  }
  if (statusGrupo === "abaixo") {
    motivos.push(
      `Grupo de WhatsApp com ${pct(proporcaoGrupo!)} dos ingressos (mínimo ${pct(MINIMO_GRUPO_WHATSAPP)})`,
    );
  }
  if (semMeta) motivos.push("Sem meta definida");
  else if (!l.sem_trafego && l.meta_ingressos == null) {
    motivos.push("Falta a meta de ingressos");
  }
  if (semDados && vendasComecaram && !foraDasMetas) {
    motivos.push("Vendas começaram e não há métricas registradas");
  }
  if (atrasos.length) {
    motivos.push(
      atrasos.length === 1
        ? `1 checkpoint atrasado há ${maiorAtraso} ${maiorAtraso === 1 ? "dia" : "dias"}`
        : `${atrasos.length} checkpoints atrasados, o mais antigo há ${maiorAtraso} dias`,
    );
  }
  if (diasSemAtualizar == null) motivos.push("Nunca atualizado pelo estrategista");
  else if (diasSemAtualizar > LIMITE_SEM_ATUALIZAR_DIAS) {
    motivos.push(`Sem atualização há ${diasSemAtualizar} dias`);
  }
  if (l.status === "vermelho") motivos.push("Estrategista marcou “Em risco”");

  if (!motivos.length) {
    motivos.push(
      foraDasMetas
        ? "Sem tráfego pago: fora das metas"
        : !vendasComecaram
        ? `Vendas começam em ${formatarData(inicio)}`
        : faixa === "acima"
          ? "Acima da meta"
          : "Na meta",
    );
  }

  return {
    faixa,
    pontos,
    // O teto do CPA vem sozinho com as vendas: só a meta de ingressos é cobrada.
    faltaMeta: !l.sem_trafego && l.meta_ingressos == null,
    janela: { inicio, fim, vendasComecaram },
    ingressos: {
      status: statusIngressos,
      vendidos,
      meta: l.meta_ingressos,
      esperado: esperado == null ? null : Math.round(esperado),
      desvio: desvioIngressos,
    },
    // Ticket em uso na régua do CPA (null = ainda sem vendas com receita).
    ticket,
    cpa: {
      status: statusCpa,
      atual: cpaAtual,
      // Meta em uso e de onde ela vem: do lançamento ou do teto de mercado.
      meta: metaCpa,
      origemMeta: origemMetaCpa,
      desvio: desvioCpa,
    },
    grupo: {
      status: statusGrupo,
      pessoas: noGrupo,
      proporcao: proporcaoGrupo,
      minimo: MINIMO_GRUPO_WHATSAPP,
    },
    diasAteD0,
    checkpointsAtrasados: atrasos.length,
    maiorAtraso,
    // null = nunca foi atualizado.
    diasSemAtualizar,
    parado: diasSemAtualizar == null || diasSemAtualizar > LIMITE_SEM_ATUALIZAR_DIAS,
    motivos,
    motivo: motivos.slice(0, 3).join(" · "),
  };
}

// Do pior para o melhor. No empate, o D0 mais próximo vem antes.
export function ordenarPorUrgencia<T extends { urgencia: Urgencia }>(itens: T[]) {
  return [...itens].sort(
    (a, b) =>
      b.urgencia.pontos - a.urgencia.pontos ||
      a.urgencia.diasAteD0 - b.urgencia.diasAteD0,
  );
}
