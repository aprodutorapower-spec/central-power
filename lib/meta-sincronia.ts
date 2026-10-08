import { hoje } from "./datas";
import { palavrasDoFiltro, somarVerba, type CampanhaMeta } from "./meta";
import { criarClienteAdmin } from "./supabase/admin";
import { janelaDeVendas } from "./urgencia";

// Só para o servidor. A verba vem de uma rotina agendada do Claude, que
// consulta o Meta Ads (o site não tem token do Meta) e entrega aqui os gastos
// das campanhas. O sistema filtra, soma e grava uma foto com fonte "meta".

export const QUEM_META = "Meta Ads (automático)";

// O que a rotina precisa consultar: conta, período e a primeira palavra do
// filtro (para o Meta já devolver menos campanhas).
export async function lancamentosDoMeta() {
  const { data } = await criarClienteAdmin()
    .from("lancamentos")
    .select("id, nome, meta_conta_id, meta_filtro, meta_desde, inicio_vendas, fim_vendas, dv0, de0, d0")
    .eq("situacao", "ativo")
    .eq("sem_trafego", false)
    .not("meta_conta_id", "is", null)
    .not("meta_filtro", "is", null);

  return (data ?? [])
    .filter((l) => palavrasDoFiltro(l.meta_filtro).length)
    .map((l) => ({
      lancamento_id: l.id as string,
      nome: l.nome as string,
      conta: l.meta_conta_id as string,
      filtro: l.meta_filtro as string,
      desde: (l.meta_desde ?? janelaDeVendas(l).inicio) as string,
      ate: hoje(),
    }))
    // Período que ainda não começou: nada a consultar.
    .filter((l) => l.desde <= l.ate);
}

export type ResultadoMeta =
  | { situacao: "atualizado" | "sem_mudanca"; verba: number; campanhas: number }
  | { situacao: "sem_meta" | "sem_campanhas" }
  | { situacao: "erro"; erro: string };

export async function gravarVerbaDoMeta(
  lancamentoId: string,
  campanhas: CampanhaMeta[],
): Promise<ResultadoMeta> {
  const admin = criarClienteAdmin();
  const { data: lancamento } = await admin
    .from("lancamentos")
    .select("id, meta_conta_id, meta_filtro, situacao")
    .eq("id", lancamentoId)
    .maybeSingle();
  if (!lancamento?.meta_conta_id || lancamento.situacao !== "ativo") {
    return { situacao: "sem_meta" };
  }

  const { verba, campanhas: quantas } = somarVerba(campanhas, lancamento.meta_filtro);
  // Nenhuma campanha bateu: pode ser falha da consulta. Não grava zero.
  if (!quantas) return { situacao: "sem_campanhas" };

  const { data: ultima } = await admin
    .from("fotos_metricas")
    .select("verba_investida, ingressos_vendidos, receita_ingressos, grupo_whatsapp")
    .eq("lancamento_id", lancamentoId)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (ultima && Number(ultima.verba_investida) === verba) {
    return { situacao: "sem_mudanca", verba, campanhas: quantas };
  }

  // A foto é o retrato completo do momento: o que o Meta não informa segue
  // com o último valor registrado.
  const { error } = await admin.from("fotos_metricas").insert({
    lancamento_id: lancamentoId,
    data: hoje(),
    fonte: "meta",
    preenchido_por_nome: QUEM_META,
    verba_investida: verba,
    ingressos_vendidos: ultima?.ingressos_vendidos ?? null,
    receita_ingressos: ultima?.receita_ingressos ?? null,
    grupo_whatsapp: ultima?.grupo_whatsapp ?? null,
  });
  if (error) return { situacao: "erro", erro: "Não foi possível gravar a verba." };

  return { situacao: "atualizado", verba, campanhas: quantas };
}
