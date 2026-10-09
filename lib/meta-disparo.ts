import { criarClienteAdmin } from "./supabase/admin";

// Só para o servidor. Acorda fora de hora a rotina do Claude que busca a verba
// no Meta Ads (a mesma das 9h10, 12h10 e 18h10). A chave de disparo é gerada
// na página da rotina (gatilho "API") e só serve para disparar essa rotina.
const ROTINA = "trig_01VUMQRFvGEYwNWR8c9vx3ZY";
const ENDERECO = `https://api.anthropic.com/v1/claude_code/routines/${ROTINA}/fire`;

// Intervalo mínimo entre dois disparos: a rotina leva perto de um minuto e
// atualiza todos os lançamentos de uma vez.
export const ESPERA_ENTRE_DISPAROS_MS = 3 * 60_000;

export function disparoDoMetaLigado() {
  return Boolean(process.env.META_ROTINA_TOKEN);
}

export type ResultadoDisparo = { situacao: "pedido" | "recente" } | { situacao: "erro"; erro: string };

export async function dispararRotinaDoMeta(): Promise<ResultadoDisparo> {
  const chave = process.env.META_ROTINA_TOKEN;
  if (!chave) return { situacao: "erro", erro: "A atualização na hora ainda não foi ligada." };

  const admin = criarClienteAdmin();
  const { data: rotina } = await admin
    .from("rotinas")
    .select("ultima_execucao")
    .eq("nome", "meta_pedido")
    .maybeSingle();
  if (
    rotina &&
    Date.now() - new Date(rotina.ultima_execucao).getTime() < ESPERA_ENTRE_DISPAROS_MS
  ) {
    return { situacao: "recente" };
  }

  let resposta: Response;
  try {
    resposta = await fetch(ENDERECO, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chave}`,
        "anthropic-beta": "experimental-cc-routine-2026-04-01",
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: "{}",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return { situacao: "erro", erro: "Não foi possível falar com a rotina do Meta Ads agora." };
  }
  if (!resposta.ok) {
    return {
      situacao: "erro",
      erro:
        resposta.status === 401 || resposta.status === 403
          ? "A chave de disparo da rotina do Meta Ads não vale mais. Avise o Ricardo."
          : resposta.status === 429
            ? "A rotina do Meta Ads já rodou muitas vezes nesta hora. Tente mais tarde."
            : "A rotina do Meta Ads não aceitou o pedido agora.",
    };
  }

  await admin
    .from("rotinas")
    .upsert({ nome: "meta_pedido", ultima_execucao: new Date().toISOString() });
  return { situacao: "pedido" };
}
