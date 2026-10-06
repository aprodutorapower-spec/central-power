import Link from "next/link";
import { notFound } from "next/navigation";
import { diasEntre, formatarData, hoje } from "@/lib/datas";
import { faseDoLancamento, MARCOS, TIPOS, type Lancamento } from "@/lib/marcos";
import { obterSessao } from "@/lib/sessao";
import { definirSituacao } from "../actions";

function contagem(dias: number) {
  if (dias === 0) return "hoje";
  if (dias === 1) return "amanhã";
  if (dias > 1) return `em ${dias} dias`;
  return dias === -1 ? "ontem" : `há ${-dias} dias`;
}

export default async function LancamentoPage({
  params,
}: PageProps<"/lancamentos/[id]">) {
  const { id } = await params;
  const { supabase } = await obterSessao();

  const { data } = await supabase
    .from("lancamentos")
    .select("*, experts(nome)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const lancamento = data as Lancamento & { experts: { nome: string } };
  const dia = hoje();
  const fase = faseDoLancamento(lancamento, dia);
  const encerrado = lancamento.situacao === "encerrado";

  const marcos = MARCOS.filter((marco) => lancamento[marco.chave]).map((marco) => ({
    ...marco,
    data: lancamento[marco.chave] as string,
  }));
  marcos.sort((a, b) => a.data.localeCompare(b.data));

  return (
    <>
      <Link
        href={`/experts/${lancamento.expert_id}`}
        className="text-sm text-apagado hover:text-texto"
      >
        ← {lancamento.experts.nome}
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{lancamento.nome}</h1>
          <p className="mt-1 text-sm text-apagado">
            {TIPOS[lancamento.tipo]}
            {lancamento.meta_ingressos != null
              ? ` · meta de ${lancamento.meta_ingressos} ingressos`
              : ""}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-sm ${fase.cor}`}>
          {fase.rotulo}
        </span>
      </div>

      <section className="mt-6 rounded-xl border border-borda bg-cartao p-5">
        <h2 className="font-semibold">Marcos</h2>
        <ul className="mt-3 divide-y divide-borda">
          {marcos.map((marco) => {
            const dias = diasEntre(dia, marco.data);
            return (
              <li
                key={marco.chave}
                className={`flex flex-wrap items-baseline justify-between gap-2 py-3 ${
                  dias < 0 ? "text-apagado" : ""
                }`}
              >
                <span>
                  <span className="inline-block w-12 font-semibold">{marco.sigla}</span>
                  <span className="text-sm">{marco.descricao}</span>
                </span>
                <span className="text-sm">
                  {formatarData(marco.data)}
                  <span className="ml-2 text-apagado">{contagem(dias)}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link
          href={`/lancamentos/${lancamento.id}/editar`}
          className="rounded-lg border border-borda px-4 py-2 hover:border-power-claro"
        >
          Editar
        </Link>
        <form action={definirSituacao}>
          <input type="hidden" name="id" value={lancamento.id} />
          <input
            type="hidden"
            name="situacao"
            value={encerrado ? "ativo" : "encerrado"}
          />
          <button type="submit" className="text-sm text-apagado hover:text-texto">
            {encerrado ? "Reabrir lançamento" : "Encerrar lançamento"}
          </button>
        </form>
      </div>
    </>
  );
}
