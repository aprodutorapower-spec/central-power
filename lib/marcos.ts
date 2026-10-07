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

// O que é cada data, em linguagem de quem preenche (aparece nas dicas do formulário).
export const EXPLICACOES: Record<ChaveMarco, string> = {
  d0: "Dia do evento. No LPS é a segunda-feira da aula 1; no LP, o dia do evento único. É a data principal: as outras são sugeridas a partir dela e, se ela mudar, os checkpoints pendentes andam junto.",
  de0: "Dia em que começa o pré-evento, a reta final antes do D0. Não é preenchido à mão: o sistema usa 7 dias antes do D0 e move junto quando o D0 muda.",
  dp0: "Dia do pitch: quando a oferta do produto principal é apresentada e o carrinho abre. Só existe no LPS. O sistema sugere o domingo, 6 dias depois do D0.",
  dfc: "Dia em que o carrinho fecha e a venda do produto principal termina. O sistema sugere 4 dias depois do D0 no LP e 2 dias depois do pitch no LPS. Passada essa data, o lançamento aparece como “Carrinho fechado”.",
  m0: "Dia da decisão: quando ficou decidido que o lançamento vai acontecer. É opcional e entra como o primeiro marco da linha do tempo.",
  dv0: "Dia em que os ingressos começam a ser vendidos. É opcional, mas vale preencher: o ritmo esperado da meta de ingressos e a contagem de vendas da Berry começam nesta data. Em branco, o sistema conta a partir do início do pré-evento (7 dias antes do D0).",
};

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
  metas_travadas: boolean;
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
