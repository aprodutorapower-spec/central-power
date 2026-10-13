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

type Numeros = {
  ingressos: number;
  receita: number;
  // Produto principal (null quando o lançamento não tem um escolhido).
  vendasPrincipal: number | null;
  faturamentoPrincipal: number | null;
};

export type ResultadoSincronia =
  | ({ situacao: "atualizado" | "sem_mudanca" } & Numeros)
  | { situacao: "sem_berry" }
  | { situacao: "erro"; erro: string };

type Consulta =
  | ({ situacao: "ok"; temIngresso: boolean } & Numeros)
  | { situacao: "sem_berry" }
  | { situacao: "erro"; erro: string };

export type ProdutoEscolhido = { id: string; nome: string };

const ids = (lista: unknown) =>
  Array.isArray(lista)
    ? (lista as ProdutoEscolhido[]).map((p) => p?.id).filter((id) => typeof id === "string")
    : [];

// Ingressos, receita e produto principal do lançamento, direto da Berry, sem gravar nada.
export async function vendasNaBerry(lancamentoId: string): Promise<Consulta> {
  const { data: lancamento } = await criarClienteAdmin()
    .from("lancamentos")
    .select(
      "id, tipo, expert_id, berry_produto_id, berry_extras, berry_principais, inicio_vendas, fim_vendas, dv0, de0, d0, dp0, dfc",
    )
    .eq("id", lancamentoId)
    .maybeSingle();
  const principais = ids(lancamento?.berry_principais);
  if (!lancamento || (!lancamento.berry_produto_id && !principais.length)) {
    return { situacao: "sem_berry" };
  }

  try {
    const chave = await chaveDoExpert(lancamento.expert_id);
    if (!chave) return { situacao: "sem_berry" };
    const janela = janelaDeVendas(lancamento);
    const numeros = await resumoDeVendas(chave, {
      ingresso: lancamento.berry_produto_id,
      extras: ids(lancamento.berry_extras),
      desde: janela.inicio,
      // No semanal todas as turmas vendem o mesmo produto: cada turma conta só
      // as vendas do seu período (até o fim das vendas, que por padrão é o D0).
      ate: lancamento.tipo === "LPS" ? janela.fim : null,
      principais,
      // O produto principal é vendido do evento (ou do pitch) ao fim do carrinho.
      principalDesde: lancamento.dp0 ?? lancamento.d0,
      principalAte: lancamento.dfc,
    });
    return {
      situacao: "ok",
      temIngresso: Boolean(lancamento.berry_produto_id),
      ingressos: numeros.ingressos,
      receita: numeros.receita,
      vendasPrincipal: numeros.vendasPrincipal,
      faturamentoPrincipal: numeros.faturamentoPrincipal,
    };
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

// O que a Berry informa numa foto: ingressos e receita só quando o lançamento
// tem produto de ingresso; produto principal só quando tem um escolhido.
export function camposDaBerry(consulta: Extract<Consulta, { situacao: "ok" }>) {
  return {
    ...(consulta.temIngresso
      ? { ingressos_vendidos: consulta.ingressos, receita_ingressos: consulta.receita }
      : {}),
    ...(consulta.vendasPrincipal != null
      ? {
          vendas_produto: consulta.vendasPrincipal,
          faturamento_produto: consulta.faturamentoPrincipal,
        }
      : {}),
  };
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
  const numeros: Numeros = {
    ingressos: consulta.ingressos,
    receita: consulta.receita,
    vendasPrincipal: consulta.vendasPrincipal,
    faturamentoPrincipal: consulta.faturamentoPrincipal,
  };

  const { data: ultima } = await admin
    .from("fotos_metricas")
    .select("*")
    .eq("lancamento_id", lancamentoId)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Nada mudou desde a última foto: não enche o histórico com linhas iguais.
  const novos = camposDaBerry(consulta) as Record<string, number | null>;
  const mudou = Object.entries(novos).some(
    ([campo, valor]) => Number(ultima?.[campo] ?? NaN) !== Number(valor ?? NaN),
  );
  if (ultima && !mudou) return { situacao: "sem_mudanca", ...numeros };

  // A foto é o retrato completo do momento: o que a Berry não informa (verba,
  // grupo de WhatsApp e comparecimento) segue com o último valor lançado.
  const { error } = await admin.from("fotos_metricas").insert({
    ...herdarDaUltima(ultima),
    ...novos,
    lancamento_id: lancamentoId,
    data: hoje(),
    fonte: "berry",
    preenchido_por_nome: QUEM_BERRY,
  });
  if (error) return { situacao: "erro", erro: "Não foi possível gravar os números." };

  return { situacao: "atualizado", ...numeros };
}

// Todos os lançamentos ativos com algum produto da Berry escolhido.
export async function sincronizarTodos() {
  const { data } = await criarClienteAdmin()
    .from("lancamentos")
    .select("id, nome")
    .eq("situacao", "ativo")
    // Com produto de ingresso, ou só com produto principal (lançamento gratuito).
    .or("berry_produto_id.not.is.null,berry_principais.neq.[]");

  const resultados = [];
  // Um de cada vez, para respeitar o limite de chamadas da Berry.
  for (const lancamento of data ?? []) {
    resultados.push({ nome: lancamento.nome, ...(await sincronizarBerry(lancamento.id)) });
  }
  return resultados;
}
