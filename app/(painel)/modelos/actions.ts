"use server";

import { revalidatePath } from "next/cache";
import { obterSessao } from "@/lib/sessao";

function campos(formData: FormData) {
  return {
    titulo: String(formData.get("titulo") ?? "").trim(),
    dias_do_d0: Math.round(Number(formData.get("dias_do_d0") ?? 0)) || 0,
    descricao: String(formData.get("descricao") ?? "").trim(),
  };
}

// Só o admin grava aqui: as regras do banco recusam os demais.
export async function salvarModelo(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const dados = campos(formData);
  if (!dados.titulo) return;

  const { supabase } = await obterSessao();
  if (id) {
    await supabase.from("checkpoint_modelos").update(dados).eq("id", id);
  } else {
    const tipo = formData.get("tipo") === "LP" ? "LP" : "LPS";
    await supabase.from("checkpoint_modelos").insert({ ...dados, tipo });
  }
  revalidatePath("/modelos");
}

export async function removerModelo(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { supabase } = await obterSessao();
  await supabase.from("checkpoint_modelos").delete().eq("id", id);
  revalidatePath("/modelos");
}
