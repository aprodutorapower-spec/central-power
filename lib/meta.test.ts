// Testes da soma da verba do Meta Ads. Rodar com: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { palavrasDoFiltro, somarVerba } from "./meta.ts";

const CAMPANHAS = [
  { nome: "Vendas | CBO | F | CL | L. Pago | T. Criativo | 31/10 - LCTO", gasto: 994.55 },
  { nome: "IG-Dermato | Vendas | CBO | F | CL | L. Pago | 31/10 - LCTO  | 31/10 - LCTO", gasto: 990.72 },
  { nome: "ThurPlay | ABO | CL | L. Pago | Depoimentos | 31/10 - LCTO", gasto: 410.44 },
  { nome: "Post do Instagram: O jeito como você administra... | 31/10 - LCTO", gasto: 382.7 },
  { nome: "Vendas | CBO | Adv | T.C | IMGs | Bulário", gasto: 4422.48 },
  { nome: "Vendas | Camp.01 | Vendas | CBO | CL | L. Pago | 31/10 - LCTO", gasto: 0 },
];

test("soma só as campanhas com todas as palavras do filtro", () => {
  const { verba, campanhas } = somarVerba(CAMPANHAS, "Vendas, 31/10 - LCTO");
  assert.equal(verba, 1985.27);
  assert.equal(campanhas, 2);
});

test("não diferencia maiúsculas, acentos nem espaços dobrados", () => {
  assert.equal(somarVerba(CAMPANHAS, "vendas,  BULARIO ").verba, 4422.48);
  assert.deepEqual(palavrasDoFiltro(" Vendas ,, 31/10 - LCTO "), ["vendas", "31/10 - lcto"]);
});

test("sem filtro não soma nada (nunca a conta inteira por engano)", () => {
  assert.equal(somarVerba(CAMPANHAS, null).verba, 0);
  assert.equal(somarVerba(CAMPANHAS, " , ").campanhas, 0);
});

test("vendas do tráfego: soma as compras das campanhas que entram na verba", () => {
  const campanhas = [
    { nome: "[VENDAS][CBO][12/10-18/10]", gasto: 1273.57, compras: 35 },
    { nome: "[VENDAS][Q][12/10-18/10]", gasto: 515.07, compras: 9 },
    { nome: "--[VENDAS][US][12/10-18/10]", gasto: 212.78, compras: null },
    { nome: "[VENDAS][TESTE-DE-CRIATIVO]", gasto: 12.08, compras: 1 },
  ];
  const { compras, campanhas: quantas } = somarVerba(campanhas, "VENDAS, 12/10-18/10");
  assert.equal(quantas, 3);
  assert.equal(compras, 44);
});

test("rotina que ainda não manda compras: vendas do tráfego ficam em branco, não zero", () => {
  assert.equal(somarVerba(CAMPANHAS, "Vendas, 31/10 - LCTO").compras, null);
});
