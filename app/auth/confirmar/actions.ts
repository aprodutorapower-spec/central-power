"use server";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";

export async function confirmarAcesso(formData: FormData) {
  const token_hash = String(formData.get("token_hash") ?? "");

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type: "magiclink",
  });

  if (error) redirect("/login?erro=link");
  redirect("/conta?aviso=primeiro");
}
