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

// Para preencher campo de formulário: 1234.5 -> "1234,50".
export function dinheiroParaCampo(valor: number | null | undefined) {
  return valor == null ? "" : valor.toFixed(2).replace(".", ",");
}

// Divisão que não quebra: sem divisor (ou zero) não há resultado.
export function dividir(a: number | null | undefined, b: number | null | undefined) {
  return a == null || !b ? null : a / b;
}
