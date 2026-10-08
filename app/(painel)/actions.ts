"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obterSessao } from "@/lib/sessao";

// As regras do banco decidem quem pode gravar o quê; aqui só montamos o pedido.
export async function criarExpert(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;

  const { supabase, perfil } = await obterSessao();
  if (!perfil) return;

  const escolhido = String(formData.get("estrategista_id") ?? "");
  const estrategista_id =
    perfil.papel === "admin" ? escolhido || null : perfil.id;

  await supabase.from("experts").insert({ nome, estrategista_id });
  revalidatePath("/", "layout");
}

export async function trocarResponsavel(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const estrategista_id = String(formData.get("estrategista_id") ?? "") || null;

  const { supabase } = await obterSessao();
  await supabase.from("experts").update({ estrategista_id }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function definirExpertAtivo(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const ativo = formData.get("ativo") === "true";

  const { supabase } = await obterSessao();
  await supabase.from("experts").update({ ativo }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function trocarSenha(formData: FormData) {
  const senha = String(formData.get("senha") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "");

  if (senha.length < 8) redirect("/conta?aviso=curta");
  if (senha !== confirmacao) redirect("/conta?aviso=diferente");

  const { supabase, perfil } = await obterSessao();
  const { error } = await supabase.auth.updateUser({ password: senha });

  if (error) redirect("/conta?aviso=erro");
  // O estrategista sai da senha direto para os experts, onde começa a preencher.
  redirect(perfil?.papel === "admin" ? "/conta?aviso=ok" : "/experts?aviso=senha");
}
