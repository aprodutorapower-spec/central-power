import { criarClienteServidor } from "@/lib/supabase/server";

export default async function PainelPage() {
  const supabase = await criarClienteServidor();
  // A regra de acesso do banco já devolve só os experts de quem está logado.
  const { data: experts } = await supabase
    .from("experts")
    .select("id, nome")
    .eq("ativo", true)
    .order("nome");

  return (
    <>
      <h1 className="text-2xl font-semibold">Experts</h1>
      {experts?.length ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {experts.map((expert) => (
            <li
              key={expert.id}
              className="rounded-xl border border-borda bg-cartao px-5 py-4"
            >
              {expert.nome}
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
