// Testes dos avisos de conexão (Berry e Meta Ads). Rodar com: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { avisosDeConexao as avisos, verbaParada } from "./conexoes.ts";

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

test("verba parada: avisa quando o Meta é lido e o investido não sobe durante a captação", () => {
  // Captação aberta (vendas de 01/10 a 12/10), leitura do Meta em dia.
  const l = { ...EM_DIA, meta_conferido_em: haHoras(1) };
  const fotos = (horas: number[], verbas: number[]) =>
    horas.map((h, i) => ({ criado_em: haHoras(h), verba_investida: verbas[i] }));

  // Subindo a cada leitura: sem aviso.
  assert.equal(verbaParada(l, fotos([20, 10, 1], [1000, 1200, 1400]), HOJE), null);
  // Parada há 6 horas confirmadas: ainda pode ser normal.
  assert.equal(verbaParada(l, fotos([20, 7, 1], [1000, 1200, 1200]), HOJE), null);
  // Parada há 10 horas, com leitura nova confirmando: avisa.
  const parada = verbaParada(l, fotos([20, 11, 4, 1], [1000, 1200, 1200, 1200]), HOJE);
  assert.equal(parada?.tipo, "verba_parada");
  assert.match(parada!.texto, /^Verba parada desde 08\/10 às 04h00/);

  // Depois do fim da captação a verba parar é o esperado.
  assert.equal(verbaParada({ ...l, fim_vendas: "2026-10-07" }, fotos([30, 20, 1], [900, 900, 900]), HOJE), null);
  // Sem leitura recente do Meta, o problema é de conexão, não de verba.
  assert.equal(verbaParada({ ...l, meta_conferido_em: haHoras(15) }, fotos([20, 16, 15], [900, 900, 900]), HOJE), null);
  // Lançamento sem tráfego ou sem Meta ligado: não se aplica.
  assert.equal(verbaParada({ ...l, sem_trafego: true }, fotos([30, 1], [900, 900]), HOJE), null);
});
