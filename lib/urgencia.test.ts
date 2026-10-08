// Testes do cálculo de urgência. Rodar com: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calcularUrgencia,
  ordenarPorUrgencia,
  PESO_ABAIXO,
  type EntradaUrgencia,
} from "./urgencia.ts";

// Cenário base: vendas de 01/01 a 31/01 (30 dias), hoje é o dia 15 (metade
// do caminho). Meta de 300 ingressos => 150 esperados hoje. Meta de CPA R$ 40.
const HOJE = "2026-01-16";
const BASE: EntradaUrgencia["lancamento"] = {
  meta_ingressos: 300,
  meta_cpa: 40,
  ticket_ingresso: null,
  inicio_vendas: null,
  fim_vendas: null,
  sem_trafego: false,
  dv0: "2026-01-01",
  de0: "2026-01-24",
  d0: "2026-01-31",
  status: "verde",
  status_atualizado_em: `${HOJE}T12:00:00Z`,
};

function cenario(
  ingressos: number | null,
  verba: number | null,
  lancamento: Partial<EntradaUrgencia["lancamento"]> = {},
  extras: Partial<EntradaUrgencia> = {},
) {
  return calcularUrgencia({
    lancamento: { ...BASE, ...lancamento },
    foto:
      ingressos == null && verba == null
        ? null
        : { ingressos_vendidos: ingressos, verba_investida: verba },
    atrasos: [],
    hoje: HOJE,
    ...extras,
  });
}

test("ritmo esperado é linear entre o início e o fim das vendas", () => {
  assert.equal(cenario(150, 6000).ingressos.esperado, 150);
  assert.equal(cenario(0, 0, {}, { hoje: "2025-12-20" }).ingressos.esperado, 0);
  assert.equal(cenario(0, 0, {}, { hoje: "2026-03-01" }).ingressos.esperado, 300);
});

test("sem DV0, a janela de vendas começa no DE0; datas do admin têm prioridade", () => {
  assert.equal(cenario(1, 1, { dv0: null }).janela.inicio, "2026-01-24");
  const ajustado = cenario(1, 1, { inicio_vendas: "2026-01-10", fim_vendas: "2026-01-20" });
  assert.deepEqual(
    [ajustado.janela.inicio, ajustado.janela.fim],
    ["2026-01-10", "2026-01-20"],
  );
});

test("abaixo nos dois: ingressos e CPA fora da meta", () => {
  // 90 de 150 esperados (40% abaixo) e CPA de R$ 60 (50% acima da meta).
  const u = cenario(90, 5400);
  assert.equal(u.faixa, "abaixo");
  assert.equal(u.ingressos.status, "abaixo");
  assert.equal(u.cpa.status, "abaixo");
  assert.match(u.motivo, /Ingressos 40% abaixo do ritmo/);
  assert.match(u.motivo, /CPA 50% acima da meta/);
});

test("abaixo em um só pesa menos que abaixo nos dois", () => {
  const soIngressos = cenario(90, 3600); // CPA R$ 40: na meta
  const soCpa = cenario(150, 9000); // CPA R$ 60, ingressos no ritmo
  const nosDois = cenario(90, 5400);

  assert.equal(soIngressos.faixa, "abaixo");
  assert.equal(soIngressos.cpa.status, "na_meta");
  assert.equal(soCpa.faixa, "abaixo");
  assert.equal(soCpa.ingressos.status, "na_meta");
  assert.ok(nosDois.pontos > soIngressos.pontos);
  assert.ok(nosDois.pontos > soCpa.pontos);
});

test("na meta: dentro dos 10% de tolerância para os dois lados", () => {
  for (const [ingressos, verba] of [[150, 6000], [136, 5900], [164, 6000]]) {
    const u = cenario(ingressos, verba);
    assert.equal(u.faixa, "na_meta", `${ingressos} ingressos`);
    assert.equal(u.motivo, "Na meta");
  }
});

test("acima: vende mais que o ritmo e gasta menos que a meta de CPA", () => {
  const u = cenario(180, 5400); // 20% acima do ritmo, CPA R$ 30
  assert.equal(u.faixa, "acima");
  assert.equal(u.ingressos.status, "acima");
  assert.equal(u.cpa.status, "acima");
  assert.ok(u.pontos < cenario(150, 6000).pontos);
});

test("sem ingresso vendido, o CPA fica sem dado e não pune", () => {
  const u = cenario(0, 500);
  assert.equal(u.cpa.status, "sem_dado");
  assert.equal(u.ingressos.status, "abaixo");
  assert.ok(u.pontos < 2 * PESO_ABAIXO);
});

test("sem meta: pendência de gestão, logo abaixo de quem está abaixo", () => {
  const semMeta = cenario(90, 5400, { meta_ingressos: null, meta_cpa: null });
  assert.equal(semMeta.faixa, "sem_meta");
  assert.equal(semMeta.faltaMeta, true);
  assert.match(semMeta.motivo, /Sem meta definida/);

  const abaixoLeve = cenario(134, 5360); // pouco abaixo, só em ingressos
  const naMeta = cenario(150, 6000);
  assert.ok(abaixoLeve.pontos > semMeta.pontos);
  assert.ok(semMeta.pontos > naMeta.pontos);
});

test("sem meta de CPA, vale o teto de mercado: o dobro do ticket, sem margem", () => {
  // Ticket de R$ 30 => teto de R$ 60.
  const ticket = { meta_cpa: null, ticket_ingresso: 30 };
  const noTeto = cenario(150, 9000, ticket); // CPA R$ 60
  assert.equal(noTeto.cpa.meta, 60);
  assert.equal(noTeto.cpa.origemMeta, "mercado");
  assert.equal(noTeto.cpa.status, "na_meta");
  assert.equal(noTeto.faltaMeta, false);

  const acimaDoTeto = cenario(150, 9300, ticket); // CPA R$ 62: passou do dobro
  assert.equal(acimaDoTeto.cpa.status, "abaixo");
  assert.equal(acimaDoTeto.faixa, "abaixo");
  assert.match(acimaDoTeto.motivo, /acima do dobro do ticket \(R\$\s62,00 contra teto de R\$\s60,00\)/);

  assert.equal(cenario(150, 7500, ticket).cpa.status, "acima"); // CPA R$ 50
});

test("com meta de CPA cadastrada, ela é a regra (o dobro do ticket não entra)", () => {
  // Meta de R$ 80, ticket de R$ 30 (o dobro seria R$ 60), CPA de R$ 70.
  const folgada = cenario(150, 10500, { meta_cpa: 80, ticket_ingresso: 30 });
  assert.equal(folgada.cpa.meta, 80);
  assert.equal(folgada.cpa.origemMeta, "lancamento");
  assert.equal(folgada.cpa.status, "acima");
  assert.doesNotMatch(folgada.motivo, /dobro do ticket/);
  assert.equal(folgada.pontos, cenario(150, 10500, { meta_cpa: 80 }).pontos);

  // Meta mais apertada que o mercado também manda: R$ 40 de meta, CPA de R$ 50.
  const apertada = cenario(150, 7500, { meta_cpa: 40, ticket_ingresso: 30 });
  assert.equal(apertada.cpa.status, "abaixo");
  assert.match(apertada.motivo, /CPA 25% acima da meta/);
});

test("grupo de WhatsApp: pelo menos 95% de quem comprou ingresso", () => {
  const com = (grupo: number | null, ingressos = 150, verba = 6000) =>
    calcularUrgencia({
      lancamento: BASE,
      foto: { ingressos_vendidos: ingressos, verba_investida: verba, grupo_whatsapp: grupo },
      atrasos: [],
      hoje: HOJE,
    });
  assert.equal(com(143).grupo.status, "na_meta"); // 95,3%
  assert.equal(com(142).grupo.status, "abaixo"); // 94,7%
  assert.equal(com(null).grupo.status, "sem_dado");
  assert.equal(com(null).faixa, "na_meta"); // sem o número do grupo, não pune

  // É critério principal: abaixo de 95%, o lançamento fica "Abaixo da meta"
  // mesmo com ingressos e CPA em ordem.
  const soGrupo = com(120);
  assert.equal(soGrupo.faixa, "abaixo");
  assert.match(soGrupo.motivo, /Grupo de WhatsApp com 80% dos ingressos \(mínimo 95%\)/);
  assert.ok(soGrupo.pontos >= PESO_ABAIXO);

  // Soma com os outros: abaixo nos três pesa mais que abaixo em dois.
  const nosTres = com(72, 90, 5400); // ingressos, CPA e grupo (80%)
  const emDois = com(90, 90, 5400); // grupo em 100%
  assert.ok(nosTres.pontos > emDois.pontos);
  // E quanto mais longe dos 95%, mais urgente.
  assert.ok(com(90).pontos > com(135).pontos);
});

test("sem meta de CPA e sem ticket: avalia os ingressos e não cobra o que falta", () => {
  const u = cenario(90, 3600, { meta_cpa: null });
  assert.equal(u.faixa, "abaixo");
  assert.equal(u.cpa.status, "sem_meta");
  assert.equal(u.faltaMeta, false);
  assert.doesNotMatch(u.motivos.join(" | "), /ticket/);

  const semIngressos = cenario(90, 3600, { meta_ingressos: null });
  assert.equal(semIngressos.faltaMeta, true);
  assert.match(semIngressos.motivos.join(" | "), /Falta a meta de ingressos/);
});

test("o ticket da régua do CPA é o médio real das vendas (receita ÷ ingressos)", () => {
  const com = (receita: number | null, verba: number, ticket_ingresso: number | null = null) =>
    calcularUrgencia({
      lancamento: { ...BASE, meta_cpa: null, ticket_ingresso },
      foto: { ingressos_vendidos: 150, verba_investida: verba, receita_ingressos: receita },
      atrasos: [],
      hoje: HOJE,
    });
  // Receita de R$ 4.500 em 150 ingressos: ticket de R$ 30, teto de R$ 60.
  const noTeto = com(4500, 9000);
  assert.equal(noTeto.ticket, 30);
  assert.equal(noTeto.cpa.meta, 60);
  assert.equal(noTeto.cpa.status, "na_meta");
  assert.equal(com(4500, 9300).cpa.status, "abaixo");
  // O ticket real passa na frente do que foi digitado em lançamentos antigos.
  assert.equal(com(4500, 9000, 50).cpa.meta, 60);
  // Sem receita registrada, vale o do cadastro; sem nenhum, não há teto.
  assert.equal(com(null, 9000, 50).cpa.meta, 100);
  assert.equal(com(null, 9000).cpa.meta, null);
});

test("sem tráfego pago: não cobra CPA nem conta como sem meta", () => {
  const fora = cenario(null, null, { sem_trafego: true, meta_ingressos: null, meta_cpa: null });
  assert.equal(fora.faixa, "sem_trafego");
  assert.equal(fora.faltaMeta, false);
  assert.equal(fora.cpa.status, "nao_se_aplica");
  assert.ok(fora.pontos < cenario(90, 5400, { meta_ingressos: null, meta_cpa: null }).pontos);

  // Com meta de ingressos, ela continua valendo; o CPA não entra.
  const organico = cenario(90, 9000, { sem_trafego: true, meta_cpa: null });
  assert.equal(organico.faixa, "abaixo");
  assert.equal(organico.cpa.status, "nao_se_aplica");
  assert.equal(organico.faltaMeta, false);
});

test("sem dados: nenhuma atualização de métricas", () => {
  const u = cenario(null, null, { status: null, status_atualizado_em: null });
  assert.equal(u.faixa, "sem_dados");
  assert.match(u.motivos.join(" | "), /não há métricas/);
  assert.ok(u.pontos > cenario(150, 6000).pontos);
  assert.ok(u.pontos < cenario(134, 5360).pontos);

  // Antes de as vendas começarem, não ter dados ainda não é problema.
  const antes = cenario(null, null, {}, { hoje: "2025-12-20" });
  assert.equal(antes.faixa, "nao_comecou");
  assert.ok(antes.pontos < u.pontos);
  assert.match(antes.motivo, /Vendas começam em 01\/01\/2026/);
});

test("mesmo desvio é mais grave com o D0 perto do que com o D0 longe", () => {
  // Os dois estão na metade da janela, com 30% a menos de ingressos que o esperado.
  const longe = cenario(70, 2800, {
    meta_ingressos: 200,
    dv0: "2025-12-17",
    d0: "2026-02-15", // 60 dias de janela, D0 em 30 dias
  });
  const perto = cenario(70, 2800, {
    meta_ingressos: 200,
    dv0: "2026-01-06",
    d0: "2026-01-26", // 20 dias de janela, D0 em 10 dias
  });

  assert.equal(longe.ingressos.esperado, perto.ingressos.esperado);
  assert.equal(longe.ingressos.desvio, perto.ingressos.desvio);
  assert.ok(perto.pontos > longe.pontos);
});

test("desempates: atraso de checkpoint, dias sem atualizar e status vermelho", () => {
  const limpo = cenario(150, 6000);
  const comAtraso = cenario(150, 6000, {}, { atrasos: [2, 5] });
  const parado = cenario(150, 6000, { status_atualizado_em: "2026-01-05T12:00:00Z" });
  const vermelho = cenario(150, 6000, { status: "vermelho" });

  assert.ok(comAtraso.pontos > limpo.pontos);
  assert.match(comAtraso.motivo, /2 checkpoints atrasados, o mais antigo há 5 dias/);
  assert.ok(parado.pontos > limpo.pontos);
  assert.equal(parado.parado, true);
  assert.match(parado.motivo, /Sem atualização há 11 dias/);
  assert.ok(vermelho.pontos > limpo.pontos);

  // Por piores que sejam, os desempates não passam quem está abaixo da meta.
  const tudoJunto = cenario(
    150,
    6000,
    { status: "vermelho", status_atualizado_em: null },
    { atrasos: [30, 30, 30] },
  );
  assert.ok(cenario(134, 5360).pontos > tudoJunto.pontos);
});

test("ordenação: do pior para o melhor", () => {
  const itens = [
    { nome: "acima", urgencia: cenario(180, 5400) },
    { nome: "sem meta", urgencia: cenario(90, 5400, { meta_ingressos: null, meta_cpa: null }) },
    { nome: "abaixo nos dois", urgencia: cenario(90, 5400) },
    { nome: "na meta", urgencia: cenario(150, 6000) },
    { nome: "abaixo em um", urgencia: cenario(90, 3600) },
    { nome: "sem dados", urgencia: cenario(null, null) },
  ];
  assert.deepEqual(
    ordenarPorUrgencia(itens).map((item) => item.nome),
    ["abaixo nos dois", "abaixo em um", "sem dados", "sem meta", "na meta", "acima"],
  );
});
