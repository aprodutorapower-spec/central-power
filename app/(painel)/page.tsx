import { criarClienteServidor } from "@/lib/supabase/server";
import { criarExpert, definirExpertAtivo } from "./actions";

export default async function PainelPage() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A regra de acesso do banco já devolve só os experts de quem está logado.
  const [{ data: perfil }, { data: experts }] = await Promise.all([
    supabase.from("perfis").select("papel").eq("id", user?.id ?? "").maybeSingle(),
    supabase.from("experts").select("id, nome, ativo").order("nome"),
  ]);

  const admin = perfil?.papel === "admin";
  const visiveis = (experts ?? []).filter((expert) => admin || expert.ativo);

  return (
    <>
      <h1 className="text-2xl font-semibold">Experts</h1>

      {admin ? (
        <form action={criarExpert} className="mt-6 flex max-w-md gap-2">
          <input
            name="nome"
            required
            placeholder="Nome do novo expert"
            aria-label="Nome do novo expert"
            className="w-full rounded-lg border border-borda bg-cartao-2 px-3 py-2 outline-none focus:border-power-claro"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-power px-4 py-2 font-semibold hover:bg-power-claro"
          >
            Adicionar
          </button>
        </form>
      ) : null}

      {visiveis.length ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visiveis.map((expert) => (
            <li
              key={expert.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-borda bg-cartao px-5 py-4"
            >
              <span className={expert.ativo ? "" : "text-apagado line-through"}>
                {expert.nome}
              </span>
              {admin ? (
                <form action={definirExpertAtivo}>
                  <input type="hidden" name="id" value={expert.id} />
                  <input type="hidden" name="ativo" value={String(!expert.ativo)} />
                  <button
                    type="submit"
                    className="text-xs text-apagado hover:text-texto"
                  >
                    {expert.ativo ? "Desativar" : "Reativar"}
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-xl border border-borda bg-cartao p-6 text-sm text-apagado">
          Nenhum expert cadastrado para você ainda.
        </p>
      )}
    </>
  );
}
