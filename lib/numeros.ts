// Aceita "1.234,56", "1234,56" e "1234.56". Vazio vira null.
export function lerDinheiro(texto: string) {
  const limpo = texto.replace(/[^\d.,]/g, "");
  if (!limpo) return null;
  const normal = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo;
  const valor = Number(normal);
  return Number.isFinite(valor) && valor >= 0 ? Math.round(valor * 100) / 100 : null;
}

export function lerInteiro(texto: string) {
  const limpo = texto.replace(/\D/g, "");
  return limpo ? Number(limpo) : null;
}

const REAL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const INTEIRO = new Intl.NumberFormat("pt-BR");

export function formatarReal(valor: number | null | undefined) {
  return valor == null ? "—" : REAL.format(valor);
}

export function formatarInteiro(valor: number | null | undefined) {
  return valor == null ? "—" : INTEIRO.format(valor);
}

export function formatarPercentual(valor: number | null | undefined) {
  return valor == null ? "—" : `${Math.round(valor * 100)}%`;
}

// Para preencher campo de formulário: 1234.5 -> "1234,50".
export function dinheiroParaCampo(valor: number | null | undefined) {
  return valor == null ? "" : valor.toFixed(2).replace(".", ",");
}

// Divisão que não quebra: sem divisor (ou zero) não há resultado.
export function dividir(a: number | null | undefined, b: number | null | undefined) {
  return a == null || !b ? null : a / b;
}

// CPA = verba ÷ vendas de ingresso que vieram do tráfego (Ricardo, 09/10/2026);
// as vendas orgânicas só somam no total de ingressos. Quando o lançamento não
// tem esse número (Meta Ads não ligado, verba digitada à mão), a conta usa o
// total de ingressos, como era antes.
export function vendasParaCpa(
  foto:
    | { ingressos_vendidos?: number | null; compras_trafego?: number | null }
    | null
    | undefined,
) {
  return foto?.compras_trafego ?? foto?.ingressos_vendidos ?? null;
}
