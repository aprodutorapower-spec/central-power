import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatarReal } from "@/lib/numeros";
import { obterSessao } from "@/lib/sessao";
import { carregarPainel } from "../../dados-painel";
import { PainelMetas, SeloFaixa } from "../../lancamentos/painel-metas";
import {
  Contagens,
  CpaDoGrupo,
  Defasagem,
  IngressosDoGrupo,
} from "../../visao-geral";

// Visão do estrategista: todos os lançamentos ativos dele, os piores primeiro.
export default async function EstrategistaPage({
  params,
}: PageProps<"/estrategistas/[id]">) {
  const { id } = await params;
  const { perfil } = await obterSessao();
  if (!perfil) redirect("/login");
  if (perfil.papel !== "admin") redirect("/experts");

  const { estrategistas } = await carregarPainel();
  const grupo = estrategistas.find(
    (e) => (e.id ?? "sem-responsavel") === id,
  );
  if (!grupo) notFound();
  const { resumo } = grupo;

  return (
    <>
      <Link href="/" className="text-sm text-apagado hover:text-texto">
        ← Visão geral
      </Link>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="flex flex-wrap items-baseline gap-x-3 text-2xl font-semibold">
          {grupo.nome}
          {resumo.faixa ? <SeloFaixa faixa={resumo.faixa} className="text-base" /> : null}
        </h1>
        <Defasagem resumo={resumo} />
      </div>
      <p className="mt-1 text-apagado">{resumo.motivo}.</p>

      {resumo.ativos ? (
        <div className="mt-6 grid gap-x-6 gap-y-3 rounded-xl border border-borda bg-cartao px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-apagado">Lançamentos</p>
            <div className="mt-0.5">
              <Contagens resumo={resumo} />
            </div>
          </div>
          <div>
            <p className="text-xs text-apagado">Verba investida</p>
            <p className="mt-0.5 font-semibold">{formatarReal(resumo.verba)}</p>
          </div>
          <div>
            <p className="text-xs text-apagado">Ingressos vendidos contra a meta</p>
            <p className="mt-0.5">
              <IngressosDoGrupo resumo={resumo} />
            </p>
          </div>
          <div>
            <p className="text-xs text-apagado">CPA médio</p>
            <p className="mt-0.5">
              <CpaDoGrupo resumo={resumo} />
            </p>
          </div>
        </div>
      ) : null}

      {grupo.itens.length ? (
        <ol className="mt-6 grid gap-3">
          {grupo.itens.map(({ lancamento, expert, urgencia }) => (
            <li
              key={lancamento.id}
              className={`rounded-xl border bg-cartao p-5 ${
                urgencia.faixa === "abaixo" ? "border-power" : "border-borda"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="font-semibold">
                  {expert} · {lancamento.nome}
                  <span className="ml-2 rounded-full border border-borda px-2 py-0.5 text-xs font-normal">
                    {lancamento.tipo}
                  </span>
                </h2>
                <SeloFaixa faixa={urgencia.faixa} className="text-sm" />
              </div>
              <p className="mt-1 text-sm">{urgencia.motivo}</p>
              <div className="mt-4 border-t border-borda pt-4">
                <PainelMetas urgencia={urgencia} />
              </div>
              <Link
                href={`/lancamentos/${lancamento.id}`}
                className="mt-4 inline-block text-sm text-apagado underline hover:text-texto"
              >
                Abrir lançamento
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-6 rounded-xl border border-borda bg-cartao p-6 text-sm text-apagado">
          Nenhum lançamento ativo.
        </p>
      )}
    </>
  );
}
