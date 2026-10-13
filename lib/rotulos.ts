// Nomes que mudam conforme o tipo do lançamento. No lançamento pago (LP e LPS)
// vendem-se ingressos e mede-se o CPA; no gratuito (LG) captam-se leads para um
// evento online e mede-se o CPL. As contas são as mesmas: só o nome muda.
//
// Sem imports, para os testes rodarem no Node puro.

export const GRATUITO = "LG";

export function ehGratuito(tipo: string | null | undefined) {
  return tipo === GRATUITO;
}

const PAGO = {
  // "Ingressos", "ingressos", "ingresso"
  Unidades: "Ingressos",
  unidades: "ingressos",
  unidade: "ingresso",
  // "57 vendidos"
  feitos: "vendidos",
  // "ingressos vendidos"
  unidadesFeitas: "ingressos vendidos",
  custo: "CPA",
  // "vendas do tráfego", "vendas orgânicas"
  doTrafego: "Vendas do tráfego",
  organicas: "Vendas orgânicas",
  // "Vendas começam em…", "As vendas começaram em…"
  janela: "Vendas",
  inicioDaJanela: "Início da venda de ingressos",
};

const SEM_COBRAR = {
  Unidades: "Leads",
  unidades: "leads",
  unidade: "lead",
  feitos: "captados",
  unidadesFeitas: "leads captados",
  custo: "CPL",
  doTrafego: "Leads do tráfego",
  organicas: "Leads orgânicos",
  janela: "Captação",
  inicioDaJanela: "Início da captação de leads",
};

export type Rotulos = typeof PAGO;

export function rotulos(tipo: string | null | undefined): Rotulos {
  return ehGratuito(tipo) ? SEM_COBRAR : PAGO;
}
