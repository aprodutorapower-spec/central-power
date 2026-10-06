import { diasEntre } from "./datas";
import { MARCOS, type Lancamento } from "./marcos";

// Checkpoint pendente que vence em até este número de dias fica "perto" (amarelo).
export const LIMITE_PERTO_DIAS = 3;

export type Checkpoint = {
  id: string;
  lancamento_id: string;
  titulo: string;
  descricao: string;
  data: string;
  estado: "pendente" | "feito" | "nao_se_aplica";
  feito_em: string | null;
  feito_por_nome: string | null;
};

export type Cor = "em_dia" | "perto" | "atrasado" | "neutro";

export type ItemLinha =
  | { tipo: "marco"; chave: string; sigla: string; titulo: string; data: string; dias: number; cor: Cor }
  | { tipo: "checkpoint"; chave: string; checkpoint: Checkpoint; data: string; dias: number; cor: Cor };

export function corDoCheckpoint(checkpoint: Checkpoint, hoje: string): Cor {
  if (checkpoint.estado === "nao_se_aplica") return "neutro";
  if (checkpoint.estado === "feito") return "em_dia";
  const dias = diasEntre(hoje, checkpoint.data);
  if (dias < 0) return "atrasado";
  return dias <= LIMITE_PERTO_DIAS ? "perto" : "em_dia";
}

// Marcos e checkpoints numa lista só, em ordem de data (marco antes no mesmo dia).
export function montarLinhaDoTempo(
  lancamento: Lancamento,
  checkpoints: Checkpoint[],
  hoje: string,
) {
  const itens: ItemLinha[] = [];

  for (const marco of MARCOS) {
    const data = lancamento[marco.chave];
    if (!data) continue;
    itens.push({
      tipo: "marco",
      chave: marco.chave,
      sigla: marco.sigla,
      titulo: marco.descricao,
      data,
      dias: diasEntre(hoje, data),
      // Marco não é "feito": só conta os dias e fica cinza depois que passa.
      cor: "neutro",
    });
  }

  for (const checkpoint of checkpoints) {
    itens.push({
      tipo: "checkpoint",
      chave: checkpoint.id,
      checkpoint,
      data: checkpoint.data,
      dias: diasEntre(hoje, checkpoint.data),
      cor: corDoCheckpoint(checkpoint, hoje),
    });
  }

  itens.sort(
    (a, b) =>
      a.data.localeCompare(b.data) ||
      (a.tipo === b.tipo ? 0 : a.tipo === "marco" ? -1 : 1),
  );

  // Próximo: o primeiro item de hoje em diante que ainda está por acontecer.
  const proximo = itens.find(
    (item) =>
      item.dias >= 0 &&
      (item.tipo === "marco" || item.checkpoint.estado === "pendente"),
  );
  const atrasados = itens.filter((item) => item.cor === "atrasado").length;

  return { itens, proximo, atrasados };
}

export function contagem(dias: number) {
  if (dias === 0) return "hoje";
  if (dias === 1) return "amanhã";
  if (dias > 1) return `em ${dias} dias`;
  return dias === -1 ? "ontem" : `há ${-dias} dias`;
}

export function tituloDoItem(item: ItemLinha) {
  return item.tipo === "marco"
    ? `${item.sigla} · ${item.titulo}`
    : item.checkpoint.titulo;
}
