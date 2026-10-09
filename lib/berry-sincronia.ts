import { chaveDoExpert, ErroBerry, resumoDeVendas } from "./berry";
import { hoje } from "./datas";
import { herdarDaUltima } from "./metricas";
import { criarClienteAdmin } from "./supabase/admin";
import { janelaDeVendas } from "./urgencia";

// Só para o servidor. Puxa da Berry os ingressos e a receita de um lançamento
// e grava uma nova foto de métricas com fonte "berry".
//
// Usa a chave de serviço (a rotina automática não tem usuário logado): quem
// chamar a partir de uma ação de tela precisa conferir antes que a pessoa
// enxerga o lançamento.

export const QUEM_BERRY = "Berry (automático)";

export type ResultadoSincronia =
  | { situacao: "atualizado" | "sem_mudanca"; ingressos: number; receita: number }
  | { situacao: "sem_berry" }
  | { situacao: "erro"; erro: string };

type Consulta =
  | { situacao: "ok"; ingressos: number; receita: number }
  | { situacao: "sem_berry" }
  | { situacao: "erro"; erro: string };

// Ingressos e receita do lançamento, direto da Berry, sem gravar nada.
export async function vendasNaBerry(lancamentoId: string): Promise<Consulta> {
  const { data: lancamento } = await criarClienteAdmin()
    .from("lancamentos")
    .select("id, expert_id, berry_produto_id, inicio_vendas, fim_vendas, dv0, de0, d0")
    .eq("id", lancamentoId)
    .maybeSingle();
  if (!lancamento?.berry_produto_id) return { situacao: "sem_berry" };

  try {
    const chave = await chaveDoExpert(lancamento.expert_id);
    if (!chave) return { situacao: "sem_berry" };
    const { ingressos, receita } = await resumoDeVendas(
      chave,
      lancamento.berry_produto_id,
      janelaDeVendas(lancamento).inicio,
    );
    return { situacao: "ok", ingressos, receita };
  } catch (erro) {
    return {
      situacao: "erro",
      erro:
        erro instanceof ErroBerry
          ? erro.message
          : "Não foi possível consultar a Berry agora.",
    };
  }
}

export async function sincronizarBerry(lancamentoId: string): Promise<ResultadoSincronia> {
  const admin = criarClienteAdmin();
  const consulta = await vendasNaBerry(lancamentoId);
  // Guarda o resultado de toda consulta (mesmo sem número novo), para a tela
  // avisar quando a Berry para de atualizar.
  if (consulta.situacao !== "sem_berry") {
    await admin
      .from("lancamentos")
      .update(
        consulta.situacao === "erro"
          ? { berry_erro: consulta.erro }
          : { berry_conferido_em: new Date().toISOString(), berry_erro: null },
      )
      .eq("id", lancamentoId);
  }
  if (consulta.situacao !== "ok") return consulta;
  const vendas = { ingressos: consulta.ingressos, receita: consulta.receita };

  const { data: ultima } = await admin
    .from("fotos_metricas")
    .select("*")
    .eq("lancamento_id", lancamentoId)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Nada mudou desde a última foto: não enche o histórico com linhas iguais.
  if (
    ultima &&
    ultima.ingressos_vendidos === vendas.ingressos &&
    Number(ultima.receita_ingressos) === vendas.receita
  ) {
    return { situacao: "sem_mudanca", ...vendas };
  }

  // A foto é o retrato completo do momento: o que a Berry não informa (verba,
  // grupo de WhatsApp e comparecimento) segue com o último valor lançado.
  const { error } = await admin.from("fotos_metricas").insert({
    ...herdarDaUltima(ultima),
    lancamento_id: lancamentoId,
    data: hoje(),
    fonte: "berry",
    preenchido_por_nome: QUEM_BERRY,
    ingressos_vendidos: vendas.ingressos,
    receita_ingressos: vendas.receita,
  });
  if (error) return { situacao: "erro", erro: "Não foi possível gravar os números." };

  return { situacao: "atualizado", ...vendas };
}

// Todos os lançamentos ativos com produto da Berry escolhido.
export async function sincronizarTodos() {
  const { data } = await criarClienteAdmin()
    .from("lancamentos")
    .select("id, nome")
    .eq("situacao", "ativo")
    .not("berry_produto_id", "is", null);

  const resultados = [];
  // Um de cada vez, para respeitar o limite de chamadas da Berry.
  for (const lancamento of data ?? []) {
    resultados.push({ nome: lancamento.nome, ...(await sincronizarBerry(lancamento.id)) });
  }
  return resultados;
}
