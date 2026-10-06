"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { calcularMarcos, type Tipo } from "@/lib/marcos";
import { obterSessao } from "@/lib/sessao";

export type ResultadoLancamento = { erro?: string };

const DATA = /^\d{4}-\d{2}-\d{2}$/;

function data(formData: FormData, campo: string) {
  const valor = String(formData.get(campo) ?? "");
  return DATA.test(valor) ? valor : null;
}

// As regras do banco garantem que o estrategista só grava nos próprios experts.
export async function salvarLancamento(
  _anterior: ResultadoLancamento,
  formData: FormData,
): Promise<ResultadoLancamento> {
  const { supabase, perfil } = await obterSessao();
  if (!perfil) return { erro: "Sua sessão expirou. Entre de novo." };

  const id = String(formData.get("id") ?? "");
  const expert_id = String(formData.get("expert_id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "") as Tipo;
  const d0 = data(formData, "d0");

  if (!nome) return { erro: "Dê um nome ao lançamento." };
  if (tipo !== "LP" && tipo !== "LPS") return { erro: "Escolha o tipo." };
  if (!d0) return { erro: "Informe a data do D0." };

  const sugerido = calcularMarcos(tipo, d0);
  const meta = String(formData.get("meta_ingressos") ?? "").trim();

  const campos = {
    nome,
    tipo,
    d0,
    m0: data(formData, "m0"),
    dv0: data(formData, "dv0"),
    de0: data(formData, "de0") ?? sugerido.de0,
    dp0: tipo === "LPS" ? (data(formData, "dp0") ?? sugerido.dp0) : null,
    dfc: data(formData, "dfc") ?? sugerido.dfc,
    meta_ingressos: meta ? Math.max(0, Math.round(Number(meta)) || 0) : null,
    atualizado_em: new Date().toISOString(),
  };

  let destino = id;
  if (id) {
    const { data: salvo } = await supabase
      .from("lancamentos")
      .update(campos)
      .eq("id", id)
      .select("id");
    if (!salvo?.length) return { erro: "Não foi possível salvar." };
  } else {
    const { data: criado, error } = await supabase
      .from("lancamentos")
      .insert({ ...campos, expert_id, criado_por: perfil.id })
      .select("id")
      .single();
    if (error || !criado) return { erro: "Não foi possível criar o lançamento." };
    destino = criado.id;
  }

  revalidatePath("/", "layout");
  redirect(`/lancamentos/${destino}`);
}

export async function definirSituacao(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const situacao = formData.get("situacao") === "encerrado" ? "encerrado" : "ativo";

  const { supabase } = await obterSessao();
  await supabase
    .from("lancamentos")
    .update({ situacao, atualizado_em: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/", "layout");
}

export async function definirEstadoCheckpoint(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const pedido = String(formData.get("estado") ?? "");
  const estado =
    pedido === "feito" || pedido === "nao_se_aplica" ? pedido : "pendente";

  const { supabase, perfil } = await obterSessao();
  if (!perfil) return;

  const feito = estado === "feito";
  await supabase
    .from("checkpoints")
    .update({
      estado,
      feito_em: feito ? new Date().toISOString() : null,
      feito_por: feito ? perfil.id : null,
      feito_por_nome: feito ? perfil.nome : null,
    })
    .eq("id", id);
  revalidatePath("/", "layout");
}

export async function definirDataCheckpoint(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const nova = data(formData, "data");
  if (!nova) return;

  const { supabase } = await obterSessao();
  await supabase.from("checkpoints").update({ data: nova }).eq("id", id);
  revalidatePath("/", "layout");
}
