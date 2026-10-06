"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";

// As regras do banco só deixam admin gravar; aqui basta repassar o pedido.
export async function criarExpert(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;

  const supabase = await criarClienteServidor();
  await supabase.from("experts").insert({ nome });
  revalidatePath("/");
}

export async function definirExpertAtivo(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const ativo = formData.get("ativo") === "true";

  const supabase = await criarClienteServidor();
  await supabase.from("experts").update({ ativo }).eq("id", id);
  revalidatePath("/");
}

export async function trocarSenha(formData: FormData) {
  const senha = String(formData.get("senha") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "");

  if (senha.length < 8) redirect("/conta?aviso=curta");
  if (senha !== confirmacao) redirect("/conta?aviso=diferente");

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.updateUser({ password: senha });

  redirect(error ? "/conta?aviso=erro" : "/conta?aviso=ok");
}
