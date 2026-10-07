"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { calcular, STATUS, type Foto, type Status } from "@/lib/metricas";
import {
  dinheiroParaCampo,
  formatarInteiro,
  formatarPercentual,
  formatarReal,
  lerDinheiro,
  lerInteiro,
} from "@/lib/numeros";
import type { Lancamento } from "@/lib/marcos";
import { calcularUrgencia } from "@/lib/urgencia";
import { SeloMeta } from "../painel-metas";
import { salvarAtualizacao, type ResultadoAtualizacao } from "../actions";

const CAMPO =
  "mt-1 w-full rounded-lg border border-borda bg-cartao-2 px-3 py-2 outline-none focus:border-power";
const INICIAL: ResultadoAtualizacao = {};

type Props = { lancamento: Lancamento; ultima: Foto | null; hoje: string };

export function FormAtualizacao({ lancamento, ultima, hoje }: Props) {
  const [resultado, acao, salvando] = useActionState(salvarAtualizacao, INICIAL);

  // Já vem com os valores da última foto: normalmente só os números mudam.
  const [status, setStatus] = useState<Status | "">(lancamento.status ?? "");
  const [verba, setVerba] = useState(dinheiroParaCampo(ultima?.verba_investida));
  const [ingressos, setIngressos] = useState(
    ultima?.ingressos_vendidos?.toString() ?? "",
  );
  const [receita, setReceita] = useState(dinheiroParaCampo(ultima?.receita_ingressos));
  const [grupo, setGrupo] = useState(ultima?.grupo_whatsapp?.toString() ?? "");

  const { cpa, ticketMedio, comparecimento } = calcular({
    verba_investida: lerDinheiro(verba),
    ingressos_vendidos: lerInteiro(ingressos),
    receita_ingressos: lerDinheiro(receita),
    grupo_whatsapp: lerInteiro(grupo),
  });

  // Salvou: recolhe o formulário e volta ao topo, onde os números novos aparecem.
  const formulario = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!resultado.ok) return;
    formulario.current?.closest("details")?.removeAttribute("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [resultado]);

  // Mesma conta das outras telas, com os números que estão sendo digitados.
  const metas = calcularUrgencia({
    lancamento,
    foto: {
      verba_investida: lerDinheiro(verba),
      ingressos_vendidos: lerInteiro(ingressos),
      grupo_whatsapp: lerInteiro(grupo),
    },
    atrasos: [],
    hoje,
  });

  return (
    <form ref={formulario} action={acao} className="mt-4">
      <input type="hidden" name="lancamento_id" value={lancamento.id} />

      <fieldset>
        <legend className="text-sm text-apagado">Como está o lançamento?</legend>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {(Object.keys(STATUS) as Status[]).map((opcao) => (
            <label
              key={opcao}
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-2 py-2 text-sm ${
                status === opcao ? "border-texto bg-cartao-2" : "border-borda"
              }`}
            >
              <input
                type="radio"
                name="status"
                value={opcao}
                checked={status === opcao}
                onChange={() => setStatus(opcao)}
                className="sr-only"
              />
              <span className={`h-2.5 w-2.5 rounded-full ${STATUS[opcao].ponto}`} />
              {STATUS[opcao].rotulo}
            </label>
          ))}
        </div>
      </fieldset>

      <p className="mt-5 text-sm font-semibold">Números até agora</p>
      <div className="mt-2 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <label className="block text-sm text-apagado">
          Verba investida até agora (R$)
          <input
            name="verba_investida"
            inputMode="decimal"
            value={verba}
            onChange={(evento) => setVerba(evento.target.value)}
            className={`${CAMPO} text-texto`}
          />
        </label>
        <label className="block text-sm text-apagado">
          Ingressos vendidos
          <input
            name="ingressos_vendidos"
            inputMode="numeric"
            value={ingressos}
            onChange={(evento) => setIngressos(evento.target.value)}
            className={`${CAMPO} text-texto`}
          />
        </label>
        <label className="block text-sm text-apagado">
          Receita de ingressos (R$)
          <input
            name="receita_ingressos"
            inputMode="decimal"
            value={receita}
            onChange={(evento) => setReceita(evento.target.value)}
            className={`${CAMPO} text-texto`}
          />
        </label>
        <label className="block text-sm text-apagado">
          No grupo de WhatsApp
          <input
            name="grupo_whatsapp"
            inputMode="numeric"
            value={grupo}
            onChange={(evento) => setGrupo(evento.target.value)}
            className={`${CAMPO} text-texto`}
          />
        </label>
      </div>
      <p className="mt-2 text-sm text-apagado">
        CPA <span className="text-texto">{formatarReal(cpa)}</span> · Ticket médio{" "}
        <span className="text-texto">{formatarReal(ticketMedio)}</span> · Comparecimento
        no grupo <span className="text-texto">{formatarPercentual(comparecimento)}</span>
      </p>

      <div className="mt-4 rounded-lg border border-borda bg-cartao-2 p-3 text-sm">
        <p className="text-xs text-apagado">Metas do lançamento</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          {lancamento.meta_ingressos != null ? (
            <>
              <span>
                {formatarInteiro(lancamento.meta_ingressos)} ingressos (
                {formatarInteiro(metas.ingressos.esperado)} esperados até hoje)
              </span>
              <SeloMeta status={metas.ingressos.status} />
            </>
          ) : (
            <span className="text-apagado">Ingressos: sem meta ainda</span>
          )}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          {metas.cpa.status === "nao_se_aplica" ? (
            <span className="text-apagado">CPA: sem tráfego pago</span>
          ) : metas.cpa.meta != null ? (
            <>
              <span>
                CPA até {formatarReal(metas.cpa.meta)}
                {metas.cpa.origemMeta === "mercado" ? " (o dobro do ticket)" : ""}
              </span>
              <SeloMeta status={metas.cpa.status} />
            </>
          ) : (
            <span className="text-apagado">CPA: sem meta ainda</span>
          )}
        </p>
        {lancamento.verba_prevista != null ? (
          <p className="mt-1">
            Verba total prevista: {formatarReal(lancamento.verba_prevista)}
            {lerDinheiro(verba) != null && lancamento.verba_prevista > 0
              ? ` (${formatarPercentual(lerDinheiro(verba)! / lancamento.verba_prevista)} já investidos)`
              : ""}
          </p>
        ) : null}
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>
            Grupo de WhatsApp: pelo menos {formatarPercentual(metas.grupo.minimo)} dos
            ingressos vendidos
          </span>
          <SeloMeta status={metas.grupo.status} />
        </p>
      </div>


      {resultado.erro ? (
        <p className="mt-4 text-sm text-power-claro" role="alert">
          {resultado.erro}
        </p>
      ) : null}
      {resultado.ok && !salvando ? (
        <p className="mt-4 text-sm text-ok" role="status">
          Atualização salva.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={salvando}
        className="mt-5 w-full rounded-lg bg-power px-5 py-2.5 font-semibold transition hover:brightness-125 disabled:cursor-wait disabled:opacity-50 sm:w-auto"
      >
        {salvando ? "Salvando…" : "Salvar atualização"}
      </button>
    </form>
  );
}
