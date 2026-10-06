import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./server";

// Cliente com a chave de serviço: ignora as regras de acesso do banco.
// Usar só em ações do servidor, depois de conferir que quem pediu é admin.
export function criarClienteAdmin() {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chave) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada");

  return createClient(SUPABASE_URL, chave, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
