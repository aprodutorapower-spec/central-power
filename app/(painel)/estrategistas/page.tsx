import { redirect } from "next/navigation";
import { obterSessao } from "@/lib/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { LinhaEstrategista } from "./linha-estrategista";

export default async function EstrategistasPage() {
  const { supabase, perfil } = await obterSessao();
  if (perfil?.papel !== "admin") redirect("/");

  const [{ data: estrategistas }, { data: experts }] = await Promise.all([
    supabase
      .from("perfis")
      .select("id, nome, email, user_id")
      .eq("papel", "estrategista")
      .order("nome"),
    supabase.from("experts").select("estrategista_id").eq("ativo", true),
  ]);

  // "Ativo" só depois do primeiro login; quem só recebeu o link é "Convidado".
  const { data: usuarios } = await criarClienteAdmin().auth.admin.listUsers({
    perPage: 1000,
  });
  const jaEntrou = new Set(
    (usuarios?.users ?? []).filter((u) => u.last_sign_in_at).map((u) => u.id),
  );

  return (
    <>
      <h1 className="text-2xl font-semibold">Estrategistas</h1>
      <p className="mt-2 max-w-2xl text-sm text-apagado">
        Informe o e-mail e gere o link de acesso. O estrategista abre o link,
        entra e cria a própria senha. Se ele esquecer a senha, gere um link novo.
      </p>
      <ul className="mt-6 grid gap-4 lg:grid-cols-2">
        {(estrategistas ?? []).map((estrategista) => (
          <LinhaEstrategista
            key={estrategista.id}
            id={estrategista.id}
            nome={estrategista.nome}
            email={estrategista.email}
            situacao={
              !estrategista.user_id
                ? "pendente"
                : jaEntrou.has(estrategista.user_id)
                  ? "ativo"
                  : "convidado"
            }
            experts={
              (experts ?? []).filter(
                (expert) => expert.estrategista_id === estrategista.id,
              ).length
            }
          />
        ))}
      </ul>
    </>
  );
}
