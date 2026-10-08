// Testes do que vira tarefa no Asana e da sugestão de encerrar. Rodar com: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { avisosParaAsana, podeEncerrar, rotinasParadas } from "./avisos.ts";

const AGORA = new Date("2026-10-08T18:00:00Z"); // 15h em Brasília
const HOJE = "2026-10-08";
const haHoras = (horas: number) => new Date(AGORA.getTime() - horas * 3_600_000).toISOString();

const ROTINAS_EM_DIA = [
  { nome: "berry", ultima_execucao: haHoras(3) },
  { nome: "meta", ultima_execucao: haHoras(3) },
  { nome: "avisos", ultima_execucao: haHoras(3) },
];

function lancamento(mudancas: Record<string, unknown> = {}) {
  return {
    id: "l1",
    nome: "Workshop",
    situacao: "ativo",
    experts: { nome: "Fulano" },
    sem_trafego: false,
    berry_produto_id: "prod_1",
    berry_conferido_em: haHoras(3),
    berry_erro: null,
    meta_conta_id: "123",
    meta_filtro: "Vendas, LCTO",
    meta_desde: null,
    meta_conferido_em: haHoras(3),
    meta_erro: null,
    inicio_vendas: null,
    fim_vendas: null,
    dv0: "2026-10-01",
    de0: "2026-10-05",
    d0: "2026-10-12",
    dfc: "2026-10-16",
    ...mudancas,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

const chaves = (lancamentos: unknown[], rotinas = ROTINAS_EM_DIA) =>
  avisosParaAsana({ lancamentos: lancamentos as never, rotinas, hoje: HOJE, agora: AGORA }).map(
    (a) => a.chave,
  );

test("tudo em dia: nenhuma tarefa", () => {
  assert.deepEqual(chaves([lancamento()]), []);
});

test("erro e conexão faltando viram tarefa, com link do lançamento", () => {
  const l = lancamento({ berry_erro: "chave inválida", meta_conta_id: null });
  const avisos = avisosParaAsana({ lancamentos: [l], rotinas: ROTINAS_EM_DIA, hoje: HOJE, agora: AGORA });
  assert.deepEqual(avisos.map((a) => a.chave), ["l1:berry:erro", "l1:meta:desconectado"]);
  assert.equal(avisos[0].titulo, "Central Power: Fulano · Workshop: Berry com erro: chave inválida");
  assert.match(avisos[0].detalhe, /central-power\.vercel\.app\/lancamentos\/l1$/);
});

test("lançamento que ainda não vende não cobra conexão", () => {
  const l = lancamento({ dv0: "2026-10-20", berry_produto_id: null, meta_conta_id: null });
  assert.deepEqual(chaves([l]), []);
});

test("lançamento com carrinho fechado não cobra conexão", () => {
  const l = lancamento({ d0: "2026-10-02", dfc: "2026-10-06", berry_produto_id: null });
  assert.deepEqual(chaves([l]), []);
});

test("aguardando a primeira rodada não vira tarefa", () => {
  assert.deepEqual(chaves([lancamento({ meta_conferido_em: null })]), []);
});

test("rotina inteira parada: uma tarefa só, não uma por lançamento", () => {
  const rotinas = [{ nome: "berry", ultima_execucao: haHoras(30) }, ...ROTINAS_EM_DIA.slice(1)];
  const parados = [
    lancamento({ berry_conferido_em: haHoras(30) }),
    lancamento({ id: "l2", berry_conferido_em: haHoras(30) }),
  ];
  assert.deepEqual(chaves(parados, rotinas), ["rotina:berry"]);
});

test("um lançamento parado com a rotina rodando vira tarefa dele", () => {
  assert.deepEqual(chaves([lancamento({ berry_conferido_em: haHoras(30) })]), ["l1:berry:parado"]);
});

test("a rotina de avisos parada aparece na tela, mas não vira tarefa", () => {
  const rotinas = [...ROTINAS_EM_DIA.slice(0, 2), { nome: "avisos", ultima_execucao: "2026-10-07T12:00:00Z" }];
  assert.deepEqual(chaves([lancamento()], rotinas), []);
  assert.deepEqual(rotinasParadas(rotinas, AGORA), [
    { nome: "avisos", texto: "A rotina de avisos no Asana não roda desde 07/10 às 09h00" },
  ]);
});

test("encerrar: só depois do último marco e do último checkpoint", () => {
  const l = { situacao: "ativo" as const, d0: "2026-10-01", dfc: "2026-10-05" };
  assert.equal(podeEncerrar(l, [{ data: "2026-10-08" }], HOJE), null);
  assert.equal(podeEncerrar(l, [{ data: "2026-10-07" }], HOJE), "2026-10-07");
  assert.equal(podeEncerrar({ ...l, situacao: "encerrado" }, [], HOJE), null);
});
