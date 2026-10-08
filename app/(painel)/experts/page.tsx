import Link from "next/link";
import { redirect } from "next/navigation";
import { obterSessao } from "@/lib/sessao";
import { criarExpert, definirExpertAtivo } from "../actions";
import { SeletorResponsavel } from "../seletor-responsavel";
import { BotaoEnviar } from "@/app/botao-enviar";

type Expert = {
  id: string;
  nome: string;
  ativo: boolean;
  estrategista_id: string | null;
};

const CAMPO =
  "rounded-lg border border-borda bg-cartao-2 px-3 py-2 outline-none focus:border-power";

export default async function ExpertsPage({
  searchParams,
}: PageProps<"/experts">) {
  const { supabase, perfil } = await obterSessao();
  if (!perfil) redirect("/login");

  const { aviso } = await searchParams;

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
        {aviso === "senha" && (
          <p className="mt-4 max-w-md rounded-lg border border-borda bg-cartao-2 px-3 py-2 text-sm">
            Senha salva. Agora cadastre seus experts para começar.
          </p>
        )}
        <form action={criarExpert} className="mt-6 flex max-w-md gap-2">
          <input
            name="nome"
            required
            placeholder="Nome do novo expert"
            aria-label="Nome do novo expert"
            className={`w-full ${CAMPO}`}
          />
          <BotaoEnviar className="shrink-0 rounded-lg bg-power px-4 py-2 font-semibold hover:brightness-125">
            Adicionar
          </BotaoEnviar>
        </form>
        {meus.length ? (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {meus.map((expert) => (
              <li key={expert.id}>
                <Link
                  href={`/experts/${expert.id}`}
                  className="block rounded-xl border border-borda bg-cartao px-5 py-4 hover:border-power"
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
  ].map((grupo) => ({
    ...grupo,
    experts: experts.filter((expert) => expert.estrategista_id === grupo.id),
  }));
  // Uma lista só, com linhas iguais: cada estrategista é um título seguido dos
  // seus experts. Quem não tem expert vai para uma faixa única no fim.
  const comExperts = grupos.filter((grupo) => grupo.experts.length > 0);
  const semExperts = grupos.filter(
    (grupo) => grupo.id !== null && grupo.experts.length === 0,
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Experts por estrategista</h1>

      <form
        action={criarExpert}
        className="mt-6 flex flex-col gap-2 sm:flex-row"
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
        <BotaoEnviar className="shrink-0 rounded-lg bg-power px-4 py-2 font-semibold hover:brightness-125">
          Adicionar
        </BotaoEnviar>
      </form>

      {comExperts.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-xl border border-borda bg-cartao">
          {comExperts.map((grupo) => (
            <section key={grupo.id ?? "sem"}>
              <h2 className="border-b border-borda bg-cartao-2 px-5 py-2 text-sm font-semibold">
                {grupo.nome}
                <span className="ml-2 font-normal text-apagado">
                  {grupo.experts.length}
                </span>
              </h2>
              <ul>
                {grupo.experts.map((expert) => (
                  <li
                    key={expert.id}
                    className="flex flex-col gap-2 border-b border-borda px-5 py-3 sm:flex-row sm:items-center sm:gap-3"
                  >
                    <Link
                      href={`/experts/${expert.id}`}
                      className="min-w-0 flex-1 hover:text-power-claro"
                    >
                      <span
                        className={`block truncate ${
                          expert.ativo ? "" : "text-apagado line-through"
                        }`}
                      >
                        {expert.nome}
                      </span>
                      <span className="block truncate text-xs text-apagado">
                        {resumo(expert.id)}
                      </span>
                    </Link>
                    <div className="flex shrink-0 items-center gap-3">
                      <SeletorResponsavel
                        expertId={expert.id}
                        expertNome={expert.nome}
                        atual={expert.estrategista_id}
                        estrategistas={estrategistas}
                      />
                      <form action={definirExpertAtivo}>
                        <input type="hidden" name="id" value={expert.id} />
                        <input
                          type="hidden"
                          name="ativo"
                          value={String(!expert.ativo)}
                        />
                        <BotaoEnviar className="w-16 text-right text-xs text-apagado hover:text-texto">
                          {expert.ativo ? "Desativar" : "Reativar"}
                        </BotaoEnviar>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {semExperts.length > 0 && (
        <section className="mt-6 rounded-xl border border-borda bg-cartao p-5">
          <h2 className="font-semibold">
            Estrategistas sem experts
            <span className="ml-2 text-sm font-normal text-apagado">
              {semExperts.length}
            </span>
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {semExperts.map((grupo) => (
              <li
                key={grupo.id}
                className="rounded-lg border border-borda bg-cartao-2 px-3 py-1 text-sm text-apagado"
              >
                {grupo.nome}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
