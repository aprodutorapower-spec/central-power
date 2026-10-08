// Testes dos avisos de conexão (Berry e Meta Ads). Rodar com: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { avisosDeConexao as avisos } from "./conexoes.ts";

// Os testes olham só o texto que aparece na tela.
const avisosDeConexao = (...entrada: Parameters<typeof avisos>) =>
  avisos(...entrada).map((aviso) => aviso.texto);

const AGORA = new Date("2026-10-08T18:00:00Z"); // 15h em Brasília
const HOJE = "2026-10-08";
const haHoras = (horas: number) => new Date(AGORA.getTime() - horas * 3_600_000).toISOString();

const EM_DIA = {
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
};

test("tudo conectado e atualizado: nenhum aviso", () => {
  assert.deepEqual(avisosDeConexao(EM_DIA, HOJE, AGORA), []);
});

test("a madrugada (15 horas entre 18h e 9h) não gera aviso", () => {
  const l = { ...EM_DIA, berry_conferido_em: haHoras(15.5), meta_conferido_em: haHoras(15.5) };
  assert.deepEqual(avisosDeConexao(l, HOJE, AGORA), []);
});

test("sem Berry e sem Meta: avisa dos dois", () => {
  const l = { ...EM_DIA, berry_produto_id: null, meta_conta_id: null };
  assert.deepEqual(avisosDeConexao(l, HOJE, AGORA), [
    "Berry não conectada: ingressos e receita não atualizam sozinhos",
    "Meta Ads não conectado: a verba não atualiza sozinha",
  ]);
});

test("lançamento sem tráfego pago não cobra Meta Ads", () => {
  const l = { ...EM_DIA, sem_trafego: true, meta_conta_id: null, meta_filtro: null };
  assert.deepEqual(avisosDeConexao(l, HOJE, AGORA), []);
});

test("rodada perdida: avisa desde quando, no horário de Brasília", () => {
  const l = { ...EM_DIA, berry_conferido_em: "2026-10-07T12:00:05Z" };
  assert.deepEqual(avisosDeConexao(l, HOJE, AGORA), ["Berry sem atualizar desde 07/10 às 09h00"]);
});

test("erro da última tentativa aparece no lugar do horário", () => {
  const l = { ...EM_DIA, meta_erro: "nenhuma campanha com gasto bate com o filtro" };
  assert.deepEqual(avisosDeConexao(l, HOJE, AGORA), [
    "Meta Ads com erro: nenhuma campanha com gasto bate com o filtro",
  ]);
});

test("conectado e ainda sem nenhuma rodada: aguardando", () => {
  const l = { ...EM_DIA, meta_conferido_em: null };
  assert.deepEqual(avisosDeConexao(l, HOJE, AGORA), [
    "Meta Ads: aguardando a primeira atualização automática",
  ]);
});

test("Meta com período que ainda não começou: sem aviso", () => {
  const l = { ...EM_DIA, meta_desde: "2026-10-20", meta_conferido_em: null };
  assert.deepEqual(avisosDeConexao(l, HOJE, AGORA), []);
});
