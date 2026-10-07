"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { diasEntre, hoje, somarDias } from "@/lib/datas";
import { calcularMarcos, type Tipo } from "@/lib/marcos";
import { lerDinheiro, lerInteiro } from "@/lib/numeros";
import { obterSessao } from "@/lib/sessao";
import { metasFechadasParaEstrategista } from "@/lib/urgencia";

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

  // Metas: o estrategista define ao criar e pode corrigir até o início das
  // vendas; depois, só o admin (o banco aplica a mesma regra).
  const admin = perfil.papel === "admin";
  const sem_trafego = formData.get("sem_trafego") === "true";
  const metas = {
    meta_ingressos: lerInteiro(String(formData.get("meta_ingressos") ?? "")),
    meta_cpa: sem_trafego
      ? null
      : lerDinheiro(String(formData.get("meta_cpa") ?? "")) || null,
    fim_vendas: data(formData, "fim_vendas"),
    sem_trafego,
  };
  if (!id && !admin) {
    if (metas.meta_ingressos == null) return { erro: "Informe a meta de ingressos." };
    if (!sem_trafego && metas.meta_cpa == null) {
      return { erro: "Informe a meta de CPA (ou marque “Sem tráfego pago”)." };
    }
  }

  const campos = {
    nome,
    tipo,
    d0,
    m0: data(formData, "m0"),
    dv0: data(formData, "dv0"),
    dp0: tipo === "LPS" ? (data(formData, "dp0") ?? sugerido.dp0) : null,
    dfc: data(formData, "dfc") ?? sugerido.dfc,
    atualizado_em: new Date().toISOString(),
  };

  let destino = id;
  if (id) {
    // O DE0 não é mais preenchido à mão: fica como está e só anda junto
    // quando o D0 muda, mantendo a mesma distância.
    const { data: antes } = await supabase
      .from("lancamentos")
      .select("d0, de0, dv0, inicio_vendas, fim_vendas, metas_travadas")
      .eq("id", id)
      .maybeSingle();
    if (!antes) return { erro: "Não foi possível salvar." };
    const podeMetas = admin || !metasFechadasParaEstrategista(antes, hoje());

    const { data: salvo } = await supabase
      .from("lancamentos")
      .update({
        ...campos,
        ...(podeMetas ? metas : {}),
        de0: somarDias(antes.de0, diasEntre(antes.d0, d0)),
      })
      .eq("id", id)
      .select("id");
    if (!salvo?.length) return { erro: "Não foi possível salvar." };
  } else {
    const { data: criado, error } = await supabase
      .from("lancamentos")
      .insert({ ...campos, ...metas, de0: sugerido.de0, expert_id, criado_por: perfil.id })
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

export type ResultadoAtualizacao = { erro?: string; ok?: boolean };

// Atualização rápida: grava o status no lançamento e uma nova foto de métricas.
export async function salvarAtualizacao(
  _anterior: ResultadoAtualizacao,
  formData: FormData,
): Promise<ResultadoAtualizacao> {
  const { supabase, perfil } = await obterSessao();
  if (!perfil) return { erro: "Sua sessão expirou. Entre de novo." };

  const lancamento_id = String(formData.get("lancamento_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (status !== "verde" && status !== "amarelo" && status !== "vermelho") {
    return { erro: "Escolha o status." };
  }

  const texto = (campo: string) => String(formData.get(campo) ?? "").trim();
  const dinheiro = (campo: string) => lerDinheiro(texto(campo));
  const inteiro = (campo: string) => lerInteiro(texto(campo));
  const agora = new Date().toISOString();

  const { data: salvo } = await supabase
    .from("lancamentos")
    .update({
      status,
      status_atualizado_em: agora,
      status_atualizado_por_nome: perfil.nome,
    })
    .eq("id", lancamento_id)
    .select("id");
  if (!salvo?.length) return { erro: "Não foi possível salvar." };

  const { error } = await supabase.from("fotos_metricas").insert({
    lancamento_id,
    data: hoje(),
    preenchido_por: perfil.id,
    preenchido_por_nome: perfil.nome,
    fonte: "manual",
    verba_investida: dinheiro("verba_investida"),
    ingressos_vendidos: inteiro("ingressos_vendidos"),
    receita_ingressos: dinheiro("receita_ingressos"),
    grupo_whatsapp: inteiro("grupo_whatsapp"),
  });
  if (error) return { erro: "O status foi salvo, mas as métricas não. Tente de novo." };

  revalidatePath("/", "layout");
  return { ok: true };
}

// Edição rápida das metas pela visão geral (só admin).
export async function definirMetas(
  _anterior: ResultadoAtualizacao,
  formData: FormData,
): Promise<ResultadoAtualizacao> {
  const { supabase, perfil } = await obterSessao();
  if (perfil?.papel !== "admin") return { erro: "Só o admin define as metas." };

  const meta_ingressos = lerInteiro(String(formData.get("meta_ingressos") ?? ""));
  const meta_cpa = lerDinheiro(String(formData.get("meta_cpa") ?? "")) || null;
  // Botão "Sem tráfego pago": tira o lançamento da cobrança de CPA.
  const sem_trafego = formData.get("sem_trafego") === "true";
  if (!sem_trafego && meta_ingressos == null && meta_cpa == null) {
    return { erro: "Preencha pelo menos uma das metas." };
  }

  const { data: salvo } = await supabase
    .from("lancamentos")
    .update({
      meta_ingressos,
      meta_cpa: sem_trafego ? null : meta_cpa,
      ...(sem_trafego ? { sem_trafego } : {}),
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", String(formData.get("id") ?? ""))
    .select("id");
  if (!salvo?.length) return { erro: "Não foi possível salvar." };

  revalidatePath("/", "layout");
  return { ok: true };
}
