import { diaDe, diasEntre } from "./datas";
import { montarLinhaDoTempo, type Checkpoint } from "./linha-do-tempo";
import type { Lancamento } from "./marcos";
import { calcular, type Foto, type Status } from "./metricas";

// Passou disso sem atualização, o painel destaca.
export const LIMITE_SEM_ATUALIZAR_DIAS = 7;

export type Linha = ReturnType<typeof montarLinha>;

export function montarLinha(
  lancamento: Lancamento,
  expert: { nome: string; estrategista_id: string | null },
  estrategista: string,
  checkpoints: Checkpoint[],
  foto: Foto | null,
  hoje: string,
) {
  const { proximo, atrasados } = montarLinhaDoTempo(lancamento, checkpoints, hoje);
  const diasSemAtualizar = lancamento.status_atualizado_em
    ? diasEntre(diaDe(lancamento.status_atualizado_em), hoje)
    : null;

  return {
    lancamento,
    expert: expert.nome,
    estrategistaId: expert.estrategista_id,
    estrategista,
    proximo,
    atrasados,
    foto,
    numeros: foto ? calcular(foto) : null,
    // null = nunca foi atualizado.
    diasSemAtualizar,
    parado: diasSemAtualizar == null || diasSemAtualizar > LIMITE_SEM_ATUALIZAR_DIAS,
  };
}

const PESO_STATUS: Record<Status | "sem", number> = {
  vermelho: 0,
  amarelo: 1,
  verde: 2,
  sem: 3,
};

// Prioridades: mais checkpoints atrasados, depois mais tempo sem atualização
// (nunca atualizado conta como o maior tempo), depois status vermelho.
export function ordenarPrioridades(linhas: Linha[]) {
  const semAtualizar = (linha: Linha) => linha.diasSemAtualizar ?? Infinity;
  return [...linhas].sort(
    (a, b) =>
      b.atrasados - a.atrasados ||
      (semAtualizar(b) === semAtualizar(a) ? 0 : semAtualizar(b) > semAtualizar(a) ? 1 : -1) ||
      PESO_STATUS[a.lancamento.status ?? "sem"] - PESO_STATUS[b.lancamento.status ?? "sem"] ||
      a.lancamento.d0.localeCompare(b.lancamento.d0),
  );
}
