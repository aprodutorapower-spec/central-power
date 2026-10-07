import { hoje } from "@/lib/datas";
import type { Checkpoint } from "@/lib/linha-do-tempo";
import type { Foto } from "@/lib/metricas";
import { montarPainel, type LancamentoDoPainel } from "@/lib/painel";
import { obterSessao } from "@/lib/sessao";

// Tudo o que a visão macro e a visão do estrategista precisam, em quatro
// consultas feitas ao mesmo tempo (nenhuma consulta por cartão). O banco só
// devolve o que quem está logado pode ver.
export async function carregarPainel() {
  const { supabase } = await obterSessao();

  const [{ data: lancamentos }, { data: estrategistas }, { data: checkpoints }, { data: fotos }] =
    await Promise.all([
      supabase
        .from("lancamentos")
        .select("*, experts(nome, estrategista_id)")
        .eq("situacao", "ativo"),
      supabase
        .from("perfis")
        .select("id, nome")
        .eq("papel", "estrategista")
        .eq("ativo", true)
        .order("nome"),
      supabase
        .from("checkpoints")
        .select("*, lancamentos!inner(situacao)")
        .eq("lancamentos.situacao", "ativo"),
      supabase
        .from("fotos_metricas")
        .select("*, lancamentos!inner(situacao)")
        .eq("lancamentos.situacao", "ativo"),
    ]);

  const dia = hoje();
  return {
    hoje: dia,
    ...montarPainel({
      lancamentos: (lancamentos ?? []) as LancamentoDoPainel[],
      estrategistas: (estrategistas ?? []) as { id: string; nome: string }[],
      checkpoints: (checkpoints ?? []) as Checkpoint[],
      fotos: (fotos ?? []) as Foto[],
      hoje: dia,
    }),
  };
}
