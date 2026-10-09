// Verba do Meta Ads: soma os gastos das campanhas cujo nome tem todas as
// palavras do filtro do lançamento (sem diferenciar maiúsculas nem acentos).
// Fica aqui, sem depender do servidor, para os testes rodarem no Node puro.

// `compras`: quantas compras o Meta atribui à campanha (ausente quando a
// rotina ainda não manda esse número).
export type CampanhaMeta = { nome: string; gasto: number; compras?: number | null };

const simples = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

// "Vendas, 31/10 - LCTO" => ["vendas", "31/10 - lcto"]
export function palavrasDoFiltro(filtro: string | null) {
  return (filtro ?? "").split(",").map(simples).filter(Boolean);
}

export function somarVerba(campanhas: CampanhaMeta[], filtro: string | null) {
  const palavras = palavrasDoFiltro(filtro);
  const contam = campanhas.filter((campanha) => {
    const nome = simples(campanha.nome);
    return (
      palavras.length > 0 &&
      Number.isFinite(campanha.gasto) &&
      campanha.gasto > 0 &&
      palavras.every((palavra) => nome.includes(palavra))
    );
  });
  const centavos = contam.reduce((soma, c) => soma + Math.round(c.gasto * 100), 0);
  // Vendas do tráfego: só quando a rotina informou compras em alguma campanha
  // (campanha com gasto e sem compra conta como zero).
  const informou = contam.some((c) => c.compras != null && Number.isFinite(c.compras));
  const compras = informou
    ? contam.reduce((soma, c) => soma + (Number.isFinite(c.compras) ? Math.round(c.compras!) : 0), 0)
    : null;
  return { verba: centavos / 100, campanhas: contam.length, compras };
}
