"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { obterSessao } from "@/lib/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export type ResultadoAcesso = { link?: string; erro?: string };

// Cria (ou reaproveita) o usuário do estrategista e devolve um link de uso
// único para o admin enviar. Não depende de e-mail chegar.
export async function gerarLinkDeAcesso(
  _anterior: ResultadoAcesso,
  formData: FormData,
): Promise<ResultadoAcesso> {
  const { perfil } = await obterSessao();
  if (perfil?.papel !== "admin") return { erro: "Só o admin pode fazer isso." };

  const perfilId = String(formData.get("perfil_id") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { erro: "Informe o e-mail." };

  const admin = criarClienteAdmin();

  const { data: alvo } = await admin
    .from("perfis")
    .select("id, user_id, email")
    .eq("id", perfilId)
    .maybeSingle();
  if (!alvo) return { erro: "Estrategista não encontrado." };

  let userId: string | null = alvo.user_id;

  if (userId && alvo.email !== email) {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      email,
      email_confirm: true,
    });
    if (error) return { erro: "Não foi possível trocar o e-mail desse acesso." };
  }

  if (!userId) {
    const criado = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    userId = criado.data.user?.id ?? null;

    if (!userId) {
      // O e-mail já tem usuário (por exemplo, de uma tentativa anterior).
      const { data: lista } = await admin.auth.admin.listUsers({ perPage: 1000 });
      userId = lista?.users.find((u) => u.email === email)?.id ?? null;
    }
    if (!userId) return { erro: "Não foi possível criar o acesso." };
  }

  const { error: erroPerfil } = await admin
    .from("perfis")
    .update({ email, user_id: userId })
    .eq("id", perfilId);
  if (erroPerfil) {
    return { erro: "Esse e-mail já está em uso por outro perfil." };
  }

  const { data: gerado, error: erroLink } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const token = gerado?.properties?.hashed_token;
  if (erroLink || !token) return { erro: "Não foi possível gerar o link." };

  const cabecalhos = await headers();
  const host = cabecalhos.get("x-forwarded-host") ?? cabecalhos.get("host");
  const protocolo = cabecalhos.get("x-forwarded-proto") ?? "https";

  revalidatePath("/estrategistas");
  return {
    link: `${protocolo}://${host}/auth/confirmar?token_hash=${token}`,
  };
}
