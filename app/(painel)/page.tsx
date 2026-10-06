import Link from "next/link";
import { redirect } from "next/navigation";
import { obterSessao } from "@/lib/sessao";
import { criarExpert, definirExpertAtivo, trocarResponsavel } from "./actions";

type Expert = {
  id: string;
  nome: string;
  ativo: boolean;
  estrategista_id: string | null;
};

const CAMPO =
  "rounded-lg border border-borda bg-cartao-2 px-3 py-2 outline-none focus:border-power-claro";

export default async function PainelPage() {
  const { supabase, perfil } = await obterSessao();
  if (!perfil) redirect("/login");

  const admin = perfil.papel === "admin";

  // A regra de acesso do banco já devolve só os experts de quem está logado.
  const [{ data: listaExperts }, { data: listaEstrategistas }] =
    await Promise.all([
      supabase
        .from("experts")
        .select("id, nome, ativo, estrategista_id")
        .order("nome"),
      admin
        ? supabase
            .from("perfis")
            .select("id, nome")
            .eq("papel", "estrategista")
            .eq("ativo", true)
            .order("nome")
        : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
    ]);

  const experts = (listaExperts ?? []) as Expert[];

  const { data: ativos } = await supabase
    .from("lancamentos")
    .select("expert_id")
    .eq("situacao", "ativo");
  const resumo = (expertId: string) => {
    const total = (ativos ?? []).filter((l) => l.expert_id === expertId).length;
    if (!total) return "Nenhum lançamento ativo";
    return total === 1 ? "1 lançamento ativo" : `${total} lançamentos ativos`;
  };
  const estrategistas = listaEstrategistas ?? [];

  if (!admin) {
    const meus = experts.filter((expert) => expert.ativo);
    return (
      <>
        <h1 className="text-2xl font-semibold">Meus experts</h1>
        <form action={criarExpert} className="mt-6 flex max-w-md gap-2">
          <input
            name="nome"
            required
            placeholder="Nome do novo expert"
            aria-label="Nome do novo expert"
            className={`w-full ${CAMPO}`}
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-power px-4 py-2 font-semibold hover:bg-power-claro"
          >
            Adicionar
          </button>
        </form>
        {meus.length ? (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {meus.map((expert) => (
              <li key={expert.id}>
                <Link
                  href={`/experts/${expert.id}`}
                  className="block rounded-xl border border-borda bg-cartao px-5 py-4 hover:border-power-claro"
                >
                  <span className="font-semibold">{expert.nome}</span>
                  <span className="mt-1 block text-sm text-apagado">
                    {resumo(expert.id)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 rounded-xl border border-borda bg-cartao p-6 text-sm text-apagado">
            Você ainda não tem experts. Adicione o primeiro acima.
          </p>
        )}
      </>
    );
  }

  const grupos = [
    ...estrategistas.map((estrategista) => ({
      id: estrategista.id as string | null,
      nome: estrategista.nome as string,
    })),
    { id: null, nome: "Sem responsável" },
  ]
    .map((grupo) => ({
      ...grupo,
      experts: experts.filter((expert) => expert.estrategista_id === grupo.id),
    }))
    .filter((grupo) => grupo.id !== null || grupo.experts.length > 0);

  return (
    <>
      <h1 className="text-2xl font-semibold">Experts por estrategista</h1>

      <form
        action={criarExpert}
        className="mt-6 flex max-w-2xl flex-col gap-2 sm:flex-row"
      >
        <input
          name="nome"
          required
          placeholder="Nome do novo expert"
          aria-label="Nome do novo expert"
          className={`w-full ${CAMPO}`}
        />
        <select
          name="estrategista_id"
          required
          defaultValue=""
          aria-label="Estrategista responsável"
          className={CAMPO}
        >
          <option value="" disabled>
            Estrategista…
          </option>
          {estrategistas.map((estrategista) => (
            <option key={estrategista.id} value={estrategista.id}>
              {estrategista.nome}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-power px-4 py-2 font-semibold hover:bg-power-claro"
        >
          Adicionar
        </button>
      </form>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {grupos.map((grupo) => (
          <section
            key={grupo.id ?? "sem"}
            className="rounded-xl border border-borda bg-cartao p-5"
          >
            <h2 className="font-semibold">
              {grupo.nome}
              <span className="ml-2 text-sm font-normal text-apagado">
                {grupo.experts.length}
              </span>
            </h2>
            {grupo.experts.length ? (
              <ul className="mt-3 divide-y divide-borda">
                {grupo.experts.map((expert) => (
                  <li
                    key={expert.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <Link
                      href={`/experts/${expert.id}`}
                      className={`hover:text-power-claro ${
                        expert.ativo ? "" : "text-apagado line-through"
                      }`}
                    >
                      {expert.nome}
                      <span className="ml-2 text-xs text-apagado">
                        {resumo(expert.id)}
                      </span>
                    </Link>
                    <div className="flex items-center gap-3">
                      <form action={trocarResponsavel} className="flex gap-1">
                        <input type="hidden" name="id" value={expert.id} />
                        <select
                          name="estrategista_id"
                          defaultValue={expert.estrategista_id ?? ""}
                          aria-label={`Responsável por ${expert.nome}`}
                          className="rounded-lg border border-borda bg-cartao-2 px-2 py-1 text-xs outline-none focus:border-power-claro"
                        >
                          <option value="">Sem responsável</option>
                          {estrategistas.map((estrategista) => (
                            <option key={estrategista.id} value={estrategista.id}>
                              {estrategista.nome}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-lg border border-borda px-2 py-1 text-xs hover:border-power-claro"
                        >
                          Trocar
                        </button>
                      </form>
                      <form action={definirExpertAtivo}>
                        <input type="hidden" name="id" value={expert.id} />
                        <input
                          type="hidden"
                          name="ativo"
                          value={String(!expert.ativo)}
                        />
                        <button
                          type="submit"
                          className="text-xs text-apagado hover:text-texto"
                        >
                          {expert.ativo ? "Desativar" : "Reativar"}
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-apagado">Nenhum expert ainda.</p>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
