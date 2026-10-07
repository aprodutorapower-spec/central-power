import { diasEntre, somarDias } from "./datas";

export type Tipo = "LP" | "LPS";

export const TIPOS: Record<Tipo, string> = {
  LP: "LP · evento único",
  LPS: "LPS · semanal 5+1",
};

// Mesmos nomes do Asana.
export const MARCOS = [
  { chave: "m0", sigla: "M0", descricao: "Dia da decisão" },
  { chave: "dv0", sigla: "DV0", descricao: "Início da venda de ingressos" },
  { chave: "de0", sigla: "DE0", descricao: "Início do pré-evento" },
  { chave: "d0", sigla: "D0", descricao: "Dia do evento / aula 1" },
  { chave: "dp0", sigla: "DP0", descricao: "Dia do pitch" },
  { chave: "dfc", sigla: "DFC", descricao: "Fechamento do carrinho" },
] as const;

export type ChaveMarco = (typeof MARCOS)[number]["chave"];

export type Lancamento = {
  id: string;
  expert_id: string;
  nome: string;
  tipo: Tipo;
  m0: string | null;
  dv0: string | null;
  de0: string;
  d0: string;
  dp0: string | null;
  dfc: string;
  meta_ingressos: number | null;
  meta_cpa: number | null;
  inicio_vendas: string | null;
  fim_vendas: string | null;
  sem_trafego: boolean;
  situacao: "ativo" | "encerrado";
  status: "verde" | "amarelo" | "vermelho" | null;
  bloqueio: string;
  proximo_passo: string;
  status_atualizado_em: string | null;
  status_atualizado_por_nome: string | null;
  berry_produto_id: string | null;
  berry_produto_nome: string | null;
};

// Datas sugeridas a partir do D0. LP: carrinho fecha em D0+4.
// LPS: pitch no domingo (D0+6) e carrinho fecha dois dias depois.
export function calcularMarcos(tipo: Tipo, d0: string) {
  const dp0 = tipo === "LPS" ? somarDias(d0, 6) : null;
  return {
    de0: somarDias(d0, -7),
    dp0,
    dfc: dp0 ? somarDias(dp0, 2) : somarDias(d0, 4),
  };
}

export function faseDoLancamento(lancamento: Lancamento, hoje: string) {
  if (lancamento.situacao === "encerrado") {
    return { rotulo: "Encerrado", cor: "border-borda text-apagado" };
  }
  if (diasEntre(hoje, lancamento.d0) > 0) {
    return { rotulo: "Previsto", cor: "border-apagado text-texto" };
  }
  if (diasEntre(hoje, lancamento.dfc) >= 0) {
    return { rotulo: "Em andamento", cor: "border-power bg-power text-texto" };
  }
  return { rotulo: "Carrinho fechado", cor: "border-borda text-texto" };
}
