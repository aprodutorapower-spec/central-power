// Nomes que mudam conforme o tipo do lançamento. No lançamento pago (LP e LPS)
// vendem-se ingressos e mede-se o CPA; no gratuito (LG) captam-se leads para um
// evento online e mede-se o CPL; no evento de Black (BLACK) a meta é a entrada
// de gente no grupo, vinda de disparos para bases antigas. As contas são as
// mesmas: só o nome muda.
//
// Sem imports, para os testes rodarem no Node puro.

export const GRATUITO = "LG";
export const BLACK = "BLACK";

export function ehGratuito(tipo: string | null | undefined) {
  return tipo === GRATUITO;
}

export function ehBlack(tipo: string | null | undefined) {
  return tipo === BLACK;
}

// Tipos que não vendem ingresso: sem Berry de ingresso, sem ticket, com CPL e
// sem a régua de 95% do grupo de WhatsApp.
export function semIngresso(tipo: string | null | undefined) {
  return ehGratuito(tipo) || ehBlack(tipo);
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

const LEADS = {
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

const GRUPO = {
  Unidades: "Pessoas no grupo",
  unidades: "pessoas no grupo",
  unidade: "pessoa",
  feitos: "no grupo",
  unidadesFeitas: "pessoas no grupo",
  custo: "CPL",
  doTrafego: "Do tráfego",
  organicas: "Da base",
  janela: "Captação",
  inicioDaJanela: "Início da captação",
};

export type Rotulos = typeof PAGO;

export function rotulos(tipo: string | null | undefined): Rotulos {
  return ehBlack(tipo) ? GRUPO : ehGratuito(tipo) ? LEADS : PAGO;
}
