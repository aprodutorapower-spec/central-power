"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sincronizarBerry, vendasNaBerry } from "@/lib/berry-sincronia";
import { CAMPOS_COMPARECIMENTO, herdarDaUltima } from "@/lib/metricas";
import { dispararRotinaDoMeta } from "@/lib/meta-disparo";
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
    verba_prevista: sem_trafego
      ? null
      : lerDinheiro(String(formData.get("verba_prevista") ?? "")),
    fim_vendas: data(formData, "fim_vendas"),
    sem_trafego,
  };
  if (!id && !admin) {
    if (metas.meta_ingressos == null) return { erro: "Informe a meta de ingressos." };
  }

  // De onde vem a verba no Meta Ads: só o admin define.
  const meta = admin
    ? {
        meta_conta_id:
          String(formData.get("meta_conta_id") ?? "").replace(/\D/g, "") || null,
        meta_filtro: String(formData.get("meta_filtro") ?? "").trim() || null,
        meta_desde: data(formData, "meta_desde"),
      }
    : {};

  const campos = {
    ...meta,
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

  // Com a Berry conectada, ingressos e receita vêm dela, conferidos na hora.
  // Se a Berry não responder, vale o que está no formulário.
  // (O "salvo" acima já provou que a pessoa enxerga o lançamento.)
  const berry = await vendasNaBerry(lancamento_id);
  const daBerry = berry.situacao === "ok" ? berry : null;

  // Comparecimento no evento: os campos só aparecem a partir do D0. O que o
  // formulário não trouxe continua com o valor da foto anterior.
  const { data: anterior } = await supabase
    .from("fotos_metricas")
    .select("*")
    .eq("lancamento_id", lancamento_id)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  const herdado = herdarDaUltima(anterior);
  const comparecimento = Object.fromEntries(
    CAMPOS_COMPARECIMENTO.map((campo) => [
      campo,
      formData.has(campo) ? inteiro(campo) : herdado[campo],
    ]),
  );

  const { error } = await supabase.from("fotos_metricas").insert({
    ...comparecimento,
    lancamento_id,
    data: hoje(),
    preenchido_por: perfil.id,
    preenchido_por_nome: perfil.nome,
    fonte: "manual",
    verba_investida: dinheiro("verba_investida"),
    ingressos_vendidos: daBerry?.ingressos ?? inteiro("ingressos_vendidos"),
    receita_ingressos: daBerry?.receita ?? dinheiro("receita_ingressos"),
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
    return { erro: "Preencha pelo menos um dos campos." };
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

// Botão "Atualizar pela Berry agora".
export async function atualizarPelaBerry(
  _anterior: ResultadoAtualizacao,
  formData: FormData,
): Promise<ResultadoAtualizacao> {
  const { supabase, perfil } = await obterSessao();
  if (!perfil) return { erro: "Sua sessão expirou. Entre de novo." };

  // A sincronia usa a chave de serviço: antes, o banco confirma que quem
  // pediu enxerga este lançamento.
  const id = String(formData.get("lancamento_id") ?? "");
  const { data: lancamento } = await supabase
    .from("lancamentos")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!lancamento) return { erro: "Lançamento não encontrado." };

  const resultado = await sincronizarBerry(lancamento.id);
  if (resultado.situacao === "erro") return { erro: resultado.erro };
  if (resultado.situacao === "sem_berry") {
    return { erro: "Conecte a Berry e escolha o produto do ingresso primeiro." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export type ResultadoMetaAgora = { erro?: string; pedido?: boolean; recente?: boolean };

// Pede à rotina do Meta Ads uma rodada fora de hora. A verba chega em cerca
// de um minuto, para todos os lançamentos com Meta ligado.
export async function atualizarPeloMeta(
  _anterior: ResultadoMetaAgora,
  formData: FormData,
): Promise<ResultadoMetaAgora> {
  const { supabase, perfil } = await obterSessao();
  if (!perfil) return { erro: "Sua sessão expirou. Entre de novo." };

  // O banco confirma que quem pediu enxerga este lançamento.
  const id = String(formData.get("lancamento_id") ?? "");
  const { data: lancamento } = await supabase
    .from("lancamentos")
    .select("id, meta_conta_id, meta_filtro, situacao")
    .eq("id", id)
    .maybeSingle();
  if (!lancamento) return { erro: "Lançamento não encontrado." };
  if (!lancamento.meta_conta_id || !lancamento.meta_filtro || lancamento.situacao !== "ativo") {
    return { erro: "Este lançamento não está ligado ao Meta Ads." };
  }

  const resultado = await dispararRotinaDoMeta();
  if (resultado.situacao === "erro") return { erro: resultado.erro };
  return resultado.situacao === "recente" ? { recente: true } : { pedido: true };
}
