// Testes do texto de cobrança. Rodar com: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { textoCobranca } from "./cobranca.ts";
import { calcularUrgencia, type EntradaUrgencia } from "./urgencia.ts";

// Vendas de 01/01 a 31/01, hoje no meio: 150 ingressos esperados de 300.
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

function cobranca(
  foto: EntradaUrgencia["foto"],
  lancamento: Partial<EntradaUrgencia["lancamento"]> = {},
  atrasados: { titulo: string; dias: number }[] = [],
) {
  return textoCobranca({
    estrategista: "Alexandre Silva",
    expert: "Ingrid Manzoni",
    lancamento: { nome: "Imersão de janeiro", d0: "2026-01-31" },
    urgencia: calcularUrgencia({
      lancamento: { ...BASE, ...lancamento },
      foto,
      atrasos: atrasados.map((a) => a.dias),
      hoje: HOJE,
    }),
    atrasados,
  });
}

test("cita ingressos, CPA e checkpoint atrasado com os números", () => {
  const texto = cobranca(
    { ingressos_vendidos: 90, verba_investida: 5400 },
    {},
    [{ titulo: "Pré-evento aberto", dias: 4 }],
  );
  assert.equal(
    texto,
    [
      "Oi, Alexandre! Tudo bem?",
      "Sobre o lançamento Imersão de janeiro (Ingrid Manzoni), com D0 em 31/01/2026 (faltam 15 dias):",
      "• Ingressos: 90 vendidos, 40% abaixo do ritmo (esperado até hoje: 150; meta: 300).",
      "• CPA: R$ 60,00, 50% acima da meta de R$ 40,00.",
      "• Checkpoint atrasado: “Pré-evento aberto” (há 4 dias).",
      "Consegue me dizer o que está travando e qual é o plano para recuperar? Obrigado!",
    ].join("\n"),
  );
});

test("cita o grupo de WhatsApp abaixo de 95% e o CPA acima do dobro do ticket", () => {
  const texto = cobranca(
    { ingressos_vendidos: 150, verba_investida: 9750, grupo_whatsapp: 120 },
    { meta_cpa: null, ticket_ingresso: 30 },
  );
  assert.match(texto!, /• CPA: R\$\s65,00, 8% acima do teto de R\$\s60,00 \(o dobro do ticket do ingresso\)\./);
  assert.match(texto!, /• Grupo de WhatsApp: 120 pessoas, 80% dos ingressos vendidos \(o mínimo é 95%\)\./);
  assert.match(texto!, /qual é o plano para recuperar/);
});

test("sem nada a cobrar, não há texto", () => {
  assert.equal(cobranca({ ingressos_vendidos: 150, verba_investida: 6000 }), null);
});

test("só falta de atualização vira um pedido para atualizar", () => {
  const texto = cobranca(
    { ingressos_vendidos: 150, verba_investida: 6000 },
    { status_atualizado_em: "2026-01-05T12:00:00Z" },
  );
  assert.match(texto!, /• Sem atualização no painel há 11 dias\./);
  assert.match(texto!, /Consegue atualizar os números hoje\?/);
});

test("vendas começaram e não há métricas", () => {
  const texto = cobranca(null, { status: null, status_atualizado_em: null });
  assert.match(texto!, /As vendas começaram em 01\/01\/2026 e ainda não há métricas/);
  assert.match(texto!, /ainda não foi atualizado no painel/);
});

test("muitos checkpoints atrasados: cita três e resume o resto", () => {
  const texto = cobranca(
    { ingressos_vendidos: 150, verba_investida: 6000 },
    {},
    [9, 7, 5, 3, 1].map((dias, i) => ({ titulo: `Entrega ${i + 1}`, dias })),
  );
  assert.equal(texto!.match(/Checkpoint atrasado:/g)?.length, 3);
  assert.match(texto!, /• Mais 2 checkpoints atrasados\./);
  assert.match(texto!, /\(há 1 dia\)|há 9 dias/);
});

test("expert sem responsável: saudação sem nome", () => {
  const texto = textoCobranca({
    estrategista: null,
    expert: "Ingrid Manzoni",
    lancamento: { nome: "Imersão", d0: "2026-01-10" },
    urgencia: calcularUrgencia({
      lancamento: { ...BASE, d0: "2026-01-10" },
      foto: { ingressos_vendidos: 90, verba_investida: 3600 },
      atrasos: [],
      hoje: HOJE,
    }),
    atrasados: [],
  });
  assert.match(texto!, /^Oi! Tudo bem\?/);
  assert.match(texto!, /\(foi há 6 dias\)/);
});
