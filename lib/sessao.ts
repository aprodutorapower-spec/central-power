import { cache } from "react";
import { criarClienteServidor } from "./supabase/server";

export type Perfil = {
  id: string;
  nome: string;
  papel: "admin" | "estrategista";
  ativo: boolean;
};

// Uma chamada por requisição, compartilhada entre layout, páginas e ações.
// Quem valida o login é o banco: sem sessão válida a função recusa.
export const obterSessao = cache(async () => {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("meu_perfil").maybeSingle();

  const perfil = (data as Perfil | null)?.ativo ? (data as Perfil) : null;
  return { supabase, logado: !error, perfil };
});
