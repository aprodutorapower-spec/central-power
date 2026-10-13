// Testes das turmas do lançamento semanal. Rodar com: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { deslocarDatasDoFiltro, nomeDaTurma, proximaTurma } from "./turmas.ts";

test("próxima turma: uma semana depois, com as vendas começando no dia seguinte ao D0 atual", () => {
  const proxima = proximaTurma({
    nome: "Workshop Profissão Vistoriador",
    d0: "2026-10-12",
    de0: "2026-10-05",
    dp0: "2026-10-18",
    dfc: "2026-10-20",
    meta_filtro: "VENDAS, 12/10-18/10",
  });
  assert.deepEqual(proxima, {
    nome: "Workshop Profissão Vistoriador · turma 19/10",
    d0: "2026-10-19",
    de0: "2026-10-12",
    dp0: "2026-10-25",
    dfc: "2026-10-27",
    dv0: "2026-10-13",
    meta_filtro: "VENDAS, 19/10-25/10",
  });
});

test("nome da turma: troca a data em vez de empilhar", () => {
  assert.equal(nomeDaTurma("Workshop · turma 19/10", "2026-10-26"), "Workshop · turma 26/10");
});

test("filtro: anda as datas, vira o mês e o ano, e não mexe no resto", () => {
  assert.equal(deslocarDatasDoFiltro("Vendas, 26/10-01/11", "2026-10-26"), "Vendas, 02/11-08/11");
  assert.equal(deslocarDatasDoFiltro("LCTO 28/12-03/01", "2026-12-28"), "LCTO 04/01-10/01");
  assert.equal(deslocarDatasDoFiltro("Vendas, Workshop", "2026-10-12"), "Vendas, Workshop");
  assert.equal(deslocarDatasDoFiltro(null, "2026-10-12"), null);
});

test("turma com fim das vendas antes do D0: a próxima começa no dia seguinte a esse fim", () => {
  const proxima = proximaTurma({
    nome: "Workshop",
    fim_vendas: "2026-10-11",
    d0: "2026-10-12",
    de0: "2026-10-05",
    dp0: "2026-10-18",
    dfc: "2026-10-20",
    meta_filtro: null,
  });
  assert.equal(proxima.dv0, "2026-10-12");
});
