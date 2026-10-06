import Link from "next/link";
import { notFound } from "next/navigation";
import { formatarData, hoje } from "@/lib/datas";
import { faseDoLancamento, type Lancamento } from "@/lib/marcos";
import { obterSessao } from "@/lib/sessao";

export default async function ExpertPage({ params }: PageProps<"/experts/[id]">) {
  const { id } = await params;
  const { supabase } = await obterSessao();

  const [{ data: expert }, { data: lista }] = await Promise.all([
    supabase.from("experts").select("id, nome").eq("id", id).maybeSingle(),
    supabase
      .from("lancamentos")
      .select("*")
      .eq("expert_id", id)
      .order("situacao")
      .order("d0"),
  ]);
  // Expert de outro estrategista não é devolvido pelo banco: vira "não encontrado".
  if (!expert) notFound();

  const lancamentos = (lista ?? []) as Lancamento[];
  const dia = hoje();

  return (
    <>
      <Link href="/experts" className="text-sm text-apagado hover:text-texto">
        ← Experts
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{expert.nome}</h1>
        <Link
          href={`/experts/${expert.id}/novo`}
          className="rounded-lg bg-power px-4 py-2 font-semibold hover:brightness-125"
        >
          Novo lançamento
        </Link>
      </div>

      {lancamentos.length ? (
        <ul className="mt-6 grid gap-3">
          {lancamentos.map((lancamento) => {
            const fase = faseDoLancamento(lancamento, dia);
            return (
              <li key={lancamento.id}>
                <Link
                  href={`/lancamentos/${lancamento.id}`}
                  className="block rounded-xl border border-borda bg-cartao px-5 py-4 hover:border-power"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{lancamento.nome}</span>
                    <span className="flex items-center gap-2 text-xs">
                      <span className="rounded-full border border-borda px-2 py-0.5">
                        {lancamento.tipo}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 ${fase.cor}`}>
                        {fase.rotulo}
                      </span>
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-apagado">
                    D0 {formatarData(lancamento.d0)} · DFC{" "}
                    {formatarData(lancamento.dfc)}
                    {lancamento.meta_ingressos != null
                      ? ` · meta de ${lancamento.meta_ingressos} ingressos`
                      : ""}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-6 rounded-xl border border-borda bg-cartao p-6 text-sm text-apagado">
          Nenhum lançamento ainda. Cadastre os ativos e os previstos em “Novo
          lançamento”.
        </p>
      )}
    </>
  );
}
