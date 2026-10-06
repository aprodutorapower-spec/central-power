import Link from "next/link";
import { notFound } from "next/navigation";
import { obterSessao } from "@/lib/sessao";
import { FormLancamento } from "../../../lancamentos/form-lancamento";

export default async function NovoLancamentoPage({
  params,
}: PageProps<"/experts/[id]/novo">) {
  const { id } = await params;
  const { supabase } = await obterSessao();

  const { data: expert } = await supabase
    .from("experts")
    .select("id, nome")
    .eq("id", id)
    .maybeSingle();
  if (!expert) notFound();

  return (
    <>
      <Link
        href={`/experts/${expert.id}`}
        className="text-sm text-apagado hover:text-texto"
      >
        ← {expert.nome}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Novo lançamento</h1>
      <FormLancamento expertId={expert.id} voltar={`/experts/${expert.id}`} />
    </>
  );
}
