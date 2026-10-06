import { cache } from "react";
import { criarClienteServidor } from "./supabase/server";

export type Perfil = {
  id: string;
  nome: string;
  papel: "admin" | "estrategista";
  ativo: boolean;
};

// Uma consulta por requisição, compartilhada entre layout, páginas e ações.
export const obterSessao = cache(async () => {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, perfil: null };

  const { data } = await supabase
    .from("perfis")
    .select("id, nome, papel, ativo")
    .eq("user_id", user.id)
    .maybeSingle();

  const perfil = data?.ativo ? (data as Perfil) : null;
  return { supabase, user, perfil };
});
