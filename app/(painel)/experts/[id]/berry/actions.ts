"use server";

import { revalidatePath } from "next/cache";
import {
  chaveDoExpert,
  cifrarChave,
  ErroBerry,
  listarProdutos,
  type ProdutoBerry,
} from "@/lib/berry";
import { sincronizarBerry } from "@/lib/berry-sincronia";
import { obterSessao } from "@/lib/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export type ResultadoBerry = { erro?: string; ok?: boolean };

const SEM_ACESSO = "Você não tem acesso a esse expert.";

function mensagem(erro: unknown) {
  return erro instanceof ErroBerry
    ? erro.message
    : "Não foi possível concluir. Tente de novo.";
}

// A chave é gravada com a chave de serviço, então o acesso é conferido aqui:
// o banco só devolve o expert a quem pode vê-lo.
async function sessaoComExpert(expertId: string) {
  const { supabase, perfil } = await obterSessao();
  if (!perfil || !expertId) return null;

  const { data } = await supabase
    .from("experts")
    .select("id")
    .eq("id", expertId)
    .maybeSingle();
  return data ? { supabase, perfil } : null;
}

export async function conectarBerry(
  _anterior: ResultadoBerry,
  formData: FormData,
): Promise<ResultadoBerry> {
  const expertId = String(formData.get("expert_id") ?? "");
  const chave = String(formData.get("chave") ?? "").trim();
  if (!chave) return { erro: "Cole a chave de API da Berry." };

  const sessao = await sessaoComExpert(expertId);
  if (!sessao) return { erro: SEM_ACESSO };

  // Só guarda a chave se a Berry aceitar.
  let produtos: ProdutoBerry[];
  try {
    produtos = await listarProdutos(chave);
  } catch (erro) {
    return { erro: mensagem(erro) };
  }

  const { error } = await criarClienteAdmin()
    .from("berry_conexoes")
    .upsert({
      expert_id: expertId,
      chave_cifrada: cifrarChave(chave),
      chave_final: chave.slice(-4),
      conectado_por: sessao.perfil.id,
      conectado_por_nome: sessao.perfil.nome,
      conectado_em: new Date().toISOString(),
    });
  if (error) return { erro: "Não foi possível guardar a chave." };

  // Chave de outra conta: os produtos escolhidos antes deixam de valer.
  const { data: escolhidos } = await sessao.supabase
    .from("lancamentos")
    .select("id, berry_produto_id")
    .eq("expert_id", expertId)
    .not("berry_produto_id", "is", null);
  const orfaos = (escolhidos ?? [])
    .filter((l) => !produtos.some((p) => p.id === l.berry_produto_id))
    .map((l) => l.id);
  if (orfaos.length) {
    await sessao.supabase
      .from("lancamentos")
      .update({ berry_produto_id: null, berry_produto_nome: null })
      .in("id", orfaos);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function desconectarBerry(formData: FormData) {
  const expertId = String(formData.get("expert_id") ?? "");
  const sessao = await sessaoComExpert(expertId);
  if (!sessao) return;

  await criarClienteAdmin().from("berry_conexoes").delete().eq("expert_id", expertId);
  await sessao.supabase
    .from("lancamentos")
    .update({ berry_produto_id: null, berry_produto_nome: null })
    .eq("expert_id", expertId);
  revalidatePath("/", "layout");
}

export async function definirProdutoBerry(
  _anterior: ResultadoBerry,
  formData: FormData,
): Promise<ResultadoBerry> {
  const lancamentoId = String(formData.get("lancamento_id") ?? "");
  const produtoId = String(formData.get("produto_id") ?? "");

  const { supabase, perfil } = await obterSessao();
  if (!perfil) return { erro: "Sua sessão expirou. Entre de novo." };

  const { data: lancamento } = await supabase
    .from("lancamentos")
    .select("id, expert_id")
    .eq("id", lancamentoId)
    .maybeSingle();
  if (!lancamento) return { erro: "Lançamento não encontrado." };

  // O nome vem da Berry, não da tela: garante que o produto é mesmo da conta.
  let produto: ProdutoBerry | undefined;
  if (produtoId) {
    const chave = await chaveDoExpert(lancamento.expert_id);
    if (!chave) return { erro: "Conecte a Berry antes de escolher o produto." };
    try {
      produto = (await listarProdutos(chave)).find((p) => p.id === produtoId);
    } catch (erro) {
      return { erro: mensagem(erro) };
    }
    if (!produto) return { erro: "Esse produto não está na conta da Berry." };
  }

  const { data: salvo } = await supabase
    .from("lancamentos")
    .update({
      berry_produto_id: produto?.id ?? null,
      berry_produto_nome: produto?.nome ?? null,
    })
    .eq("id", lancamentoId)
    .select("id");
  if (!salvo?.length) return { erro: "Não foi possível salvar." };

  // Produto escolhido: já traz ingressos e receita para o lançamento.
  if (produto) await sincronizarBerry(lancamentoId);

  revalidatePath("/", "layout");
  return { ok: true };
}
