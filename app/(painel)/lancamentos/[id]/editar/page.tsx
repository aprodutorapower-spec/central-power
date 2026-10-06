import Link from "next/link";
import { notFound } from "next/navigation";
import type { Lancamento } from "@/lib/marcos";
import { obterSessao } from "@/lib/sessao";
import { FormLancamento } from "../../form-lancamento";

export default async function EditarLancamentoPage({
  params,
}: PageProps<"/lancamentos/[id]/editar">) {
  const { id } = await params;
  const { supabase } = await obterSessao();

  const { data } = await supabase
    .from("lancamentos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const lancamento = data as Lancamento;
  const voltar = `/lancamentos/${lancamento.id}`;

  return (
    <>
      <Link href={voltar} className="text-sm text-apagado hover:text-texto">
        ← {lancamento.nome}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Editar lançamento</h1>
      <FormLancamento
        expertId={lancamento.expert_id}
        lancamento={lancamento}
        voltar={voltar}
      />
    </>
  );
}
