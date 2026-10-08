"use server";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";

// O link só é gasto aqui, junto com a criação da senha: quem abre o link e
// fecha a página sem terminar pode abrir de novo depois.
export async function criarSenha(formData: FormData) {
  const token_hash = String(formData.get("token_hash") ?? "");
  const senha = String(formData.get("senha") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "");

  const voltar = (aviso: string) =>
    redirect(`/auth/confirmar?token_hash=${encodeURIComponent(token_hash)}&aviso=${aviso}`);
  if (senha.length < 8) voltar("curta");
  if (senha !== confirmacao) voltar("diferente");

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash,
    type: "magiclink",
  });
  if (error) redirect("/login?erro=link");

  const { error: erroSenha } = await supabase.auth.updateUser({ password: senha });
  // O link já foi gasto e a pessoa está dentro: termina pela tela da conta.
  if (erroSenha) redirect("/conta?aviso=primeiro");

  // Sai para a pessoa entrar com e-mail e senha, como fará nos próximos acessos.
  await supabase.auth.signOut();
  const email = data.user?.email ?? "";
  redirect(`/login?aviso=senha&email=${encodeURIComponent(email)}`);
}
