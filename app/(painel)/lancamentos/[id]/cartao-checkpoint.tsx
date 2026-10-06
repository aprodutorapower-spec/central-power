"use client";

import { useOptimistic, useTransition } from "react";
import { diaDe, diasEntre, formatarData } from "@/lib/datas";
import { contagem, corDoCheckpoint, CORES, type Checkpoint } from "@/lib/linha-do-tempo";
import { definirDataCheckpoint, definirEstadoCheckpoint } from "../actions";

const BOTAO =
  "rounded-lg border border-borda px-3 py-1.5 text-sm hover:border-power disabled:opacity-50";

type Props = { checkpoint: Checkpoint; hoje: string; proximo: boolean; quem: string };

// A marcação aparece na hora; o servidor confirma em seguida.
export function CartaoCheckpoint({ checkpoint, hoje, proximo, quem }: Props) {
  const [, iniciar] = useTransition();
  const [atual, aplicar] = useOptimistic(
    checkpoint,
    (anterior, mudanca: Partial<Checkpoint>) => ({ ...anterior, ...mudanca }),
  );

  const cor = CORES[corDoCheckpoint(atual, hoje)];
  const dias = diasEntre(hoje, atual.data);
  const pendente = atual.estado === "pendente";

  function mudarEstado(estado: Checkpoint["estado"]) {
    const dados = new FormData();
    dados.set("id", checkpoint.id);
    dados.set("estado", estado);
    iniciar(async () => {
      aplicar({
        estado,
        feito_em: estado === "feito" ? new Date().toISOString() : null,
        feito_por_nome: estado === "feito" ? quem : null,
      });
      await definirEstadoCheckpoint(dados);
    });
  }

  function mudarData(dados: FormData) {
    const nova = String(dados.get("data") ?? "");
    if (!nova) return;
    iniciar(async () => {
      aplicar({ data: nova });
      await definirDataCheckpoint(dados);
    });
  }

  return (
    <li className="relative pb-4 pl-6">
      <span
        className={`absolute -left-[5px] top-5 h-2.5 w-2.5 rounded-full ${cor.ponto}`}
      />
      <div
        className={`rounded-xl border bg-cartao p-4 ${
          proximo ? "border-power" : "border-borda"
        }`}
      >
        {proximo ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-power-claro">
            Próximo
          </p>
        ) : null}
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span
            className={`font-semibold ${
              atual.estado === "nao_se_aplica" ? "text-apagado line-through" : ""
            }`}
          >
            {atual.titulo}
          </span>
          <span className="text-sm">
            {formatarData(atual.data)}
            {pendente ? (
              <span className={`ml-2 ${cor.texto}`}>{contagem(dias)}</span>
            ) : null}
          </span>
        </div>
        {atual.descricao ? (
          <p className="mt-1 text-sm text-apagado">{atual.descricao}</p>
        ) : null}
        {atual.estado === "feito" ? (
          <p className="mt-1 text-sm text-ok">
            Feito
            {atual.feito_em ? ` em ${formatarData(diaDe(atual.feito_em))}` : ""}
            {atual.feito_por_nome ? ` por ${atual.feito_por_nome}` : ""}
          </p>
        ) : null}
        {atual.estado === "nao_se_aplica" ? (
          <p className="mt-1 text-sm text-apagado">Não se aplica</p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-start gap-2">
          {pendente ? (
            <button
              type="button"
              onClick={() => mudarEstado("feito")}
              className="rounded-lg bg-power px-3 py-1.5 text-sm font-semibold hover:brightness-125"
            >
              Marcar como feito
            </button>
          ) : (
            <button type="button" onClick={() => mudarEstado("pendente")} className={BOTAO}>
              Voltar para pendente
            </button>
          )}
          <details>
            <summary className={`cursor-pointer list-none ${BOTAO}`}>Mais opções</summary>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <form action={mudarData} className="flex items-end gap-2">
                <input type="hidden" name="id" value={checkpoint.id} />
                <label className="text-xs text-apagado">
                  Nova data
                  <input
                    type="date"
                    name="data"
                    required
                    defaultValue={atual.data}
                    className="mt-1 block rounded-lg border border-borda bg-cartao-2 px-2 py-1.5 text-sm text-texto outline-none focus:border-power"
                  />
                </label>
                <button type="submit" className={BOTAO}>
                  Salvar data
                </button>
              </form>
              {atual.estado !== "nao_se_aplica" ? (
                <button
                  type="button"
                  onClick={() => mudarEstado("nao_se_aplica")}
                  className={BOTAO}
                >
                  Não se aplica
                </button>
              ) : null}
            </div>
          </details>
        </div>
      </div>
    </li>
  );
}
