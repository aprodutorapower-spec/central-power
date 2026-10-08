"use server";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";

export async function entrar(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  const primeiro = formData.get("primeiro") === "sim";
  if (error) redirect(primeiro ? "/login?erro=1&aviso=senha" : "/login?erro=1");
  // Primeiro acesso (acabou de criar a senha): começa pelos experts.
  redirect(primeiro ? "/experts" : "/");
}

export async function sair() {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
