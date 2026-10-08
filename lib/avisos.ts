// O que vira tarefa no Asana do Ricardo: rotina parada e conexão quebrada.
// A rotina de avisos (uma tarefa agendada do Claude, com o conector do Asana)
// lê esta lista e cria uma tarefa para cada item novo.
//
// Imports com ".ts" pelo mesmo motivo de urgencia.ts: os testes rodam no Node.
import { avisosDeConexao, horasDesde, HORAS_SEM_ROTINA, quando } from "./conexoes.ts";
import { janelaDeVendas } from "./urgencia.ts";
import type { Lancamento } from "./marcos";

export const SITE = "https://central-power.vercel.app";

// "a rotina da Berry", "a rotina do Meta Ads"...
export const ROTINAS = {
  berry: "da Berry",
  meta: "do Meta Ads",
  avisos: "de avisos no Asana",
} as const;
export type NomeRotina = keyof typeof ROTINAS;
export type Rotina = { nome: string; ultima_execucao: string };

export type Aviso = {
  chave: string;
  lancamento_id: string | null;
  titulo: string;
  detalhe: string;
};

// Rotinas que perderam uma rodada (mais de 16 horas sem rodar).
export function rotinasParadas(rotinas: Rotina[], agora: Date) {
  return rotinas
    .filter(
      (r): r is Rotina & { nome: NomeRotina } =>
        r.nome in ROTINAS && horasDesde(r.ultima_execucao, agora) > HORAS_SEM_ROTINA,
    )
    .map((r) => ({
      nome: r.nome,
      texto: `A rotina ${ROTINAS[r.nome]} não roda desde ${quando(r.ultima_execucao)}`,
    }));
}

const O_QUE_FAZER = {
  berry: {
    desconectado: "Abra o expert, entre em Berry, cole a chave de API e escolha o produto do ingresso.",
    erro: "Confira a chave de API da Berry do expert (pode ter sido trocada ou apagada) e o produto escolhido.",
    parado: "A Berry deste lançamento perdeu uma rodada. Abra o lançamento e clique em “Atualizar pela Berry agora” para ver o erro.",
  },
  meta: {
    desconectado: "Em Editar lançamento, preencha a conta de anúncios e as palavras do nome das campanhas (só o admin).",
    erro: "Confira a conta de anúncios e as palavras do filtro em Editar lançamento, e se o conector do Meta Ads tem acesso a essa conta.",
    parado: "O Meta Ads deste lançamento perdeu uma rodada. Confira a rotina em https://claude.ai/code/routines.",
  },
} as const;

export function avisosParaAsana(dados: {
  lancamentos: (Lancamento & { experts: { nome: string } })[];
  rotinas: Rotina[];
  hoje: string;
  agora: Date;
}): Aviso[] {
  // A rotina de avisos é quem cria as tarefas: não tem como avisar de si mesma.
  const paradas = rotinasParadas(dados.rotinas, dados.agora).filter((r) => r.nome !== "avisos");
  const avisos: Aviso[] = paradas.map((rotina) => ({
    chave: `rotina:${rotina.nome}`,
    lancamento_id: null,
    titulo: `Central Power: ${rotina.texto.charAt(0).toLowerCase()}${rotina.texto.slice(1)}`,
    detalhe:
      rotina.nome === "berry"
        ? "Nenhum lançamento está recebendo ingressos e receita. O agendador fica no banco (Supabase, tarefa berry-3x-ao-dia). Peça ao Claude para conferir."
        : "Nenhum lançamento está recebendo a verba. Confira em https://claude.ai/code/routines se a rotina “Central Power: verba do Meta Ads” está ligada e se o conector do Meta Ads continua conectado.",
  }));

  for (const l of dados.lancamentos) {
    if (l.situacao !== "ativo") continue;
    const vendendo = janelaDeVendas(l).inicio <= dados.hoje;
    for (const aviso of avisosDeConexao(l, dados.hoje, dados.agora)) {
      if (aviso.tipo === "aguardando") continue;
      // Lançamento que ainda não vende não precisa estar conectado.
      // Nem o que já fechou o carrinho: aí a sugestão é encerrar.
      if (aviso.tipo === "desconectado" && (!vendendo || dados.hoje > l.dfc)) continue;
      // Rotina inteira parada: uma tarefa só, não uma por lançamento.
      if (aviso.tipo === "parado" && paradas.some((r) => r.nome === aviso.fonte)) continue;
      avisos.push({
        chave: `${l.id}:${aviso.fonte}:${aviso.tipo}`,
        lancamento_id: l.id,
        titulo: `Central Power: ${l.experts.nome} · ${l.nome}: ${aviso.texto}`,
        detalhe: `${O_QUE_FAZER[aviso.fonte][aviso.tipo]}\n\nLançamento: ${SITE}/lancamentos/${l.id}`,
      });
    }
  }
  return avisos;
}

// Depois do último marco e do último checkpoint, o lançamento pode ser
// encerrado (é isso que desliga as atualizações automáticas dele).
export function podeEncerrar(
  l: Pick<Lancamento, "situacao" | "dfc" | "d0">,
  checkpoints: { data: string }[],
  hoje: string,
) {
  if (l.situacao !== "ativo") return null;
  const ultimo = [l.dfc, l.d0, ...checkpoints.map((c) => c.data)].sort().at(-1)!;
  return hoje > ultimo ? ultimo : null;
}
