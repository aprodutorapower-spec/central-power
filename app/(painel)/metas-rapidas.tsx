"use client";

import Link from "next/link";
import { ehGratuito, rotulos } from "@/lib/rotulos";
import { useActionState } from "react";
import { dinheiroParaCampo } from "@/lib/numeros";
import { definirMetas, type ResultadoAtualizacao } from "./lancamentos/actions";

const CAMPO =
  "mt-1 w-full rounded-lg border border-borda bg-cartao-2 px-3 py-2 outline-none focus:border-power";
const INICIAL: ResultadoAtualizacao = {};

type Props = {
  id: string;
  nome: string;
  dono: string;
  metaIngressos: number | null;
  metaCpa: number | null;
  tipo: string;
};

// Linha de edição rápida das metas de um lançamento, sem sair da visão geral.
export function MetaRapida({ id, nome, dono, metaIngressos, metaCpa, tipo }: Props) {
  const [resultado, acao, salvando] = useActionState(definirMetas, INICIAL);
  const gratuito = ehGratuito(tipo);
  const r = rotulos(tipo);

  return (
    <li className="py-3">
      <form action={acao} className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_8rem_8rem_auto_auto]">
        <input type="hidden" name="id" value={id} />
        <div className="min-w-0">
          <Link href={`/lancamentos/${id}`} className="font-semibold hover:text-power-claro">
            {nome}
          </Link>
          <p className="truncate text-sm text-apagado">{dono}</p>
        </div>
        <label className="block text-xs text-apagado">
          Meta de {r.unidades}
          <input
            name="meta_ingressos"
            inputMode="numeric"
            defaultValue={metaIngressos ?? ""}
            placeholder={gratuito ? "Ex.: 5.000" : "Ex.: 300"}
            className={`${CAMPO} text-base text-texto`}
          />
        </label>
        <label className="block text-xs text-apagado">
          Meta de {r.custo} (R$)
          <input
            name="meta_cpa"
            inputMode="decimal"
            defaultValue={dinheiroParaCampo(metaCpa)}
            placeholder={gratuito ? "Ex.: 4,50" : "2× o ticket"}
            className={`${CAMPO} text-base text-texto`}
          />
        </label>
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg border border-borda px-4 py-2 font-semibold transition hover:border-power disabled:cursor-wait disabled:opacity-50"
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="submit"
          name="sem_trafego"
          value="true"
          disabled={salvando}
          title={`Tira este lançamento da cobrança de ${r.custo}`}
          className="rounded-lg px-2 py-2 text-sm text-apagado transition hover:text-texto disabled:opacity-50"
        >
          Sem tráfego pago
        </button>
      </form>
      {resultado.erro ? (
        <p className="mt-2 text-sm text-power-claro" role="alert">
          {resultado.erro}
        </p>
      ) : null}
    </li>
  );
}
