// Testes da ordenação do painel com cenários fictícios (nada vai ao banco).
// Rodar com: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { montarPainel, precisaDeAtencao, type LancamentoDoPainel } from "./painel.ts";
import type { Checkpoint } from "./linha-do-tempo";
import type { Foto } from "./metricas";

// Mesma janela dos testes de urgência: vendas de 01/01 a 31/01, hoje no meio.
// Meta de 300 ingressos => 150 esperados hoje. Meta de CPA R$ 40.
const HOJE = "2026-01-16";

function lancamento(
  id: string,
  estrategista: string | null,
  extras: Partial<LancamentoDoPainel> = {},
): LancamentoDoPainel {
  return {
    id,
    expert_id: `expert-${id}`,
    nome: `Lançamento ${id}`,
    tipo: "LP",
    m0: null,
    dv0: "2026-01-01",
    de0: "2026-01-24",
    d0: "2026-01-31",
    dp0: null,
    dfc: "2026-02-04",
    meta_ingressos: 300,
    meta_cpa: 40,
    ticket_ingresso: null,
    meta_conta_id: null,
    meta_filtro: null,
    meta_desde: null,
    berry_conferido_em: null,
    berry_erro: null,
    meta_conferido_em: null,
    meta_erro: null,
    meta_campanhas: null,
    verba_prevista: null,
    inicio_vendas: null,
    fim_vendas: null,
    sem_trafego: false,
    metas_travadas: false,
    situacao: "ativo",
    status: "verde",
    bloqueio: "",
    proximo_passo: "",
    status_atualizado_em: `${HOJE}T12:00:00Z`,
    status_atualizado_por_nome: "Teste",
    berry_produto_id: null,
    berry_produto_nome: null,
    experts: { nome: `Expert ${id}`, estrategista_id: estrategista },
    ...extras,
  };
}

function foto(lancamentoId: string, ingressos: number, verba: number, quando = HOJE): Foto {
  return {
    id: `foto-${lancamentoId}-${quando}`,
    lancamento_id: lancamentoId,
    data: quando,
    criado_em: `${quando}T10:00:00Z`,
    preenchido_por_nome: "Teste",
    fonte: "manual",
    verba_investida: verba,
    ingressos_vendidos: ingressos,
    receita_ingressos: null,
    grupo_whatsapp: null,
    comp_aula1: null,
    comp_aula2: null,
    comp_aula3: null,
    comp_aula4: null,
    comp_aula5: null,
    comp_pitch: null,
    vendas_produto: null,
    faturamento_produto: null,
  };
}

const ESTRATEGISTAS = [
  { id: "ana", nome: "Ana" }, // tudo na meta
  { id: "bia", nome: "Bia" }, // um lançamento abaixo em ingressos
  { id: "caio", nome: "Caio" }, // um abaixo nos dois + um acima
  { id: "duda", nome: "Duda" }, // sem lançamento ativo
  { id: "edu", nome: "Edu" }, // só um lançamento sem meta
];

const painel = montarPainel({
  estrategistas: ESTRATEGISTAS,
  lancamentos: [
    lancamento("a1", "ana"),
    lancamento("a2", "ana"),
    lancamento("b1", "bia"),
    lancamento("b2", "bia"),
    lancamento("c1", "caio"),
    lancamento("c2", "caio"),
    lancamento("e1", "edu", { meta_ingressos: null, meta_cpa: null }),
    lancamento("x1", null),
  ],
  fotos: [
    foto("a1", 150, 6000),
    foto("a2", 155, 6000),
    foto("b1", 90, 3600), // 40% abaixo em ingressos, CPA na meta
    foto("b2", 150, 6000),
    foto("c1", 60, 1800, "2026-01-10"), // foto antiga: não é a que vale
    foto("c1", 90, 5400), // abaixo nos dois (CPA R$ 60)
    foto("c2", 180, 5400), // acima
    foto("e1", 100, 4000),
    foto("x1", 150, 6000),
  ],
  checkpoints: [
    { id: "cp1", lancamento_id: "a1", titulo: "Atrasado", descricao: "", data: "2026-01-10", estado: "pendente", feito_em: null, feito_por_nome: null },
    { id: "cp2", lancamento_id: "a2", titulo: "Feito", descricao: "", data: "2026-01-10", estado: "feito", feito_em: null, feito_por_nome: null },
  ] satisfies Checkpoint[],
  hoje: HOJE,
});

const grupo = (id: string | null) => painel.estrategistas.find((e) => e.id === id)!;

test("estrategistas do pior para o melhor, com quem não tem lançamento no fim", () => {
  assert.deepEqual(
    painel.estrategistas.map((e) => e.nome),
    ["Caio", "Bia", "Edu", "Ana", "Sem responsável", "Duda"],
  );
});

test("o estrategista leva a urgência e a situação do seu pior lançamento", () => {
  const caio = grupo("caio");
  assert.equal(caio.resumo.faixa, "abaixo");
  assert.equal(caio.resumo.pior?.lancamento.id, "c1");
  assert.equal(caio.resumo.pontos, caio.itens[0].urgencia.pontos);
  assert.deepEqual(caio.itens.map((i) => i.lancamento.id), ["c1", "c2"]);
  assert.equal(caio.resumo.porFaixa.abaixo, 1);
  assert.equal(caio.resumo.porFaixa.acima, 1);
});

test("vale a foto mais recente de cada lançamento", () => {
  assert.equal(grupo("caio").itens[0].foto?.ingressos_vendidos, 90);
  assert.equal(grupo("caio").itens[0].fotos.length, 2);
});

test("tendência do CPA sai das duas últimas fotos de métricas", () => {
  const c1 = grupo("caio").itens[0]; // CPA foi de R$ 30 para R$ 60
  assert.equal(c1.tendenciaCpa, "subindo");
  assert.equal(grupo("ana").itens[0].tendenciaCpa, null); // uma foto só
  assert.deepEqual(grupo("ana").itens[0].atrasados, [{ titulo: "Atrasado", dias: 6 }]);
});

test("resumo soma ingressos e calcula o CPA médio ponderado", () => {
  const caio = grupo("caio").resumo;
  assert.equal(caio.ingressos, 270);
  assert.equal(caio.metaIngressos, 600);
  assert.equal(caio.verba, 10800);
  assert.equal(caio.verbaPrevista, 0); // ninguém informou a verba prevista
  assert.equal(caio.cpa, 40); // 10.800 ÷ 270
  assert.equal(caio.metaCpa, 40);
});

test("frase do motivo cita o que está abaixo", () => {
  assert.equal(
    grupo("bia").resumo.motivo,
    "2 lançamentos ativos, 1 abaixo da meta de ingressos",
  );
  assert.match(grupo("edu").resumo.motivo, /1 sem meta/);
  // "Onde começar" mostra só os problemas, sem contar os lançamentos ativos.
  assert.equal(grupo("bia").resumo.problemas, "1 lançamento abaixo da meta de ingressos");
  assert.equal(
    grupo("caio").resumo.problemas,
    "1 lançamento abaixo da meta de ingressos, 1 lançamento com CPA acima da meta",
  );
  assert.equal(grupo("ana").resumo.problemas, "");
  assert.equal(grupo("ana").resumo.motivo, "2 lançamentos ativos, tudo na meta ou acima");
  assert.equal(grupo("duda").resumo.motivo, "Nenhum lançamento ativo");
});

test("só precisa de atenção quem tem algo abaixo da meta ou sem dados", () => {
  assert.deepEqual(
    painel.estrategistas.filter((e) => precisaDeAtencao(e.resumo)).map((e) => e.nome),
    ["Caio", "Bia"],
  );
});

test("checkpoint atrasado desempata entre lançamentos na meta", () => {
  assert.deepEqual(grupo("ana").itens.map((i) => i.lancamento.id), ["a1", "a2"]);
  assert.equal(grupo("ana").itens[0].urgencia.checkpointsAtrasados, 1);
  assert.equal(grupo("ana").itens[1].urgencia.checkpointsAtrasados, 0);
});

test("totais da operação e lista de lançamentos sem meta", () => {
  assert.equal(painel.operacao.ativos, 8);
  assert.equal(painel.operacao.porFaixa.abaixo, 2);
  assert.equal(painel.operacao.porFaixa.sem_meta, 1);
  assert.equal(painel.operacao.ingressos, 1065);
  assert.deepEqual(painel.semMeta.map((i) => i.lancamento.id), ["e1"]);
});

test("lançamento sem tráfego pago não entra no CPA nem na lista de sem meta", () => {
  const p = montarPainel({
    estrategistas: [{ id: "ana", nome: "Ana" }],
    lancamentos: [
      lancamento("a1", "ana"),
      lancamento("a3", "ana", { sem_trafego: true, meta_ingressos: null, meta_cpa: null }),
    ],
    fotos: [foto("a1", 150, 6000), foto("a3", 50, 9999)],
    checkpoints: [],
    hoje: HOJE,
  });
  assert.equal(p.operacao.cpa, 40);
  assert.equal(p.operacao.porFaixa.sem_trafego, 1);
  assert.equal(p.semMeta.length, 0);
  assert.equal(p.estrategistas[0].resumo.faixa, "na_meta");
});
