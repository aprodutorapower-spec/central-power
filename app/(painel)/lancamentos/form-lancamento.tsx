"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ehSegunda, formatarData } from "@/lib/datas";
import {
  calcularMarcos,
  EXPLICACOES,
  TIPOS,
  type ChaveMarco,
  type Lancamento,
  type Tipo,
} from "@/lib/marcos";
import { dinheiroParaCampo, formatarInteiro, formatarReal } from "@/lib/numeros";
import { janelaDeVendas } from "@/lib/urgencia";
import { Dica } from "../interacoes";
import { salvarLancamento, type ResultadoLancamento } from "./actions";

const CAMPO =
  "mt-1 w-full rounded-lg border border-borda bg-cartao-2 px-3 py-2 outline-none focus:border-power";
const INICIAL: ResultadoLancamento = {};

// Rótulo de um campo de data com o "?" que explica o que ela é.
function RotuloData({ campo, children }: { campo: ChaveMarco; children: React.ReactNode }) {
  return (
    <div className="relative flex items-center gap-1.5 text-sm text-apagado">
      <label htmlFor={campo}>{children}</label>
      <Dica texto={EXPLICACOES[campo]} />
    </div>
  );
}

type Props = {
  expertId: string;
  lancamento?: Lancamento;
  voltar: string;
  admin: boolean;
};

export function FormLancamento({ expertId, lancamento, voltar, admin }: Props) {
  const [resultado, acao, salvando] = useActionState(salvarLancamento, INICIAL);

  const [tipo, setTipo] = useState<Tipo>(lancamento?.tipo ?? "LPS");
  const [d0, setD0] = useState(lancamento?.d0 ?? "");
  const [de0, setDe0] = useState(lancamento?.de0 ?? "");
  const [dp0, setDp0] = useState(lancamento?.dp0 ?? "");
  const [dfc, setDfc] = useState(lancamento?.dfc ?? "");

  // Mudou o D0 ou o tipo: as datas calculadas são refeitas (e seguem editáveis).
  function recalcular(novoTipo: Tipo, novoD0: string) {
    if (!novoD0) return;
    const sugerido = calcularMarcos(novoTipo, novoD0);
    setDe0(sugerido.de0);
    setDp0(sugerido.dp0 ?? "");
    setDfc(sugerido.dfc);
  }

  return (
    <form
      action={acao}
      className="mt-6 max-w-2xl rounded-xl border border-borda bg-cartao p-5 sm:p-6"
    >
      <input type="hidden" name="id" value={lancamento?.id ?? ""} />
      <input type="hidden" name="expert_id" value={expertId} />

      <label className="block text-sm text-apagado" htmlFor="nome">
        Nome do lançamento
      </label>
      <input
        id="nome"
        name="nome"
        required
        defaultValue={lancamento?.nome ?? ""}
        placeholder="Ex.: Turma de novembro"
        className={CAMPO}
      />

      <fieldset className="mt-4">
        <legend className="text-sm text-apagado">Tipo</legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {(Object.keys(TIPOS) as Tipo[]).map((opcao) => (
            <label
              key={opcao}
              className={`cursor-pointer rounded-lg border px-3 py-2 ${
                tipo === opcao ? "border-texto bg-cartao-2 font-semibold" : "border-borda"
              }`}
            >
              <input
                type="radio"
                name="tipo"
                value={opcao}
                checked={tipo === opcao}
                onChange={() => {
                  setTipo(opcao);
                  recalcular(opcao, d0);
                }}
                className="sr-only"
              />
              {TIPOS[opcao]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <RotuloData campo="d0">
            D0 · {tipo === "LPS" ? "aula 1 (segunda)" : "dia do evento"}
          </RotuloData>
          <input
            id="d0"
            name="d0"
            type="date"
            required
            value={d0}
            onChange={(evento) => {
              setD0(evento.target.value);
              recalcular(tipo, evento.target.value);
            }}
            className={CAMPO}
          />
          {tipo === "LPS" && d0 && !ehSegunda(d0) ? (
            <p className="mt-1 text-xs text-apagado">
              No LPS o D0 costuma ser uma segunda-feira. Pode salvar assim mesmo.
            </p>
          ) : null}
        </div>
      </div>

      <p className="mt-6 text-sm font-semibold">Datas calculadas a partir do D0</p>
      <p className="text-xs text-apagado">Pode ajustar qualquer uma.</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        <div>
          <RotuloData campo="de0">
            DE0 · pré-evento
          </RotuloData>
          <input
            id="de0"
            name="de0"
            type="date"
            value={de0}
            onChange={(evento) => setDe0(evento.target.value)}
            className={CAMPO}
          />
        </div>
        {tipo === "LPS" ? (
          <div>
            <RotuloData campo="dp0">
              DP0 · pitch
            </RotuloData>
            <input
              id="dp0"
              name="dp0"
              type="date"
              value={dp0}
              onChange={(evento) => setDp0(evento.target.value)}
              className={CAMPO}
            />
          </div>
        ) : null}
        <div>
          <RotuloData campo="dfc">
            DFC · carrinho fecha
          </RotuloData>
          <input
            id="dfc"
            name="dfc"
            type="date"
            value={dfc}
            onChange={(evento) => setDfc(evento.target.value)}
            className={CAMPO}
          />
        </div>
      </div>

      <p className="mt-6 text-sm font-semibold">Opcionais</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <RotuloData campo="m0">
            M0 · dia da decisão
          </RotuloData>
          <input
            id="m0"
            name="m0"
            type="date"
            defaultValue={lancamento?.m0 ?? ""}
            className={CAMPO}
          />
        </div>
        <div>
          <RotuloData campo="dv0">
            DV0 · início da venda de ingressos
          </RotuloData>
          <input
            id="dv0"
            name="dv0"
            type="date"
            defaultValue={lancamento?.dv0 ?? ""}
            className={CAMPO}
          />
        </div>
      </div>


      <p className="mt-6 text-sm font-semibold">Metas</p>
      {admin ? (
        <>
          <p className="text-xs text-apagado">
            Só você (admin) edita. O estrategista vê, mas não muda.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-apagado" htmlFor="meta_ingressos">
                Meta de ingressos (total a vender)
              </label>
              <input
                id="meta_ingressos"
                name="meta_ingressos"
                inputMode="numeric"
                defaultValue={lancamento?.meta_ingressos ?? ""}
                placeholder="Ex.: 300"
                className={CAMPO}
              />
            </div>
            <div>
              <label className="block text-sm text-apagado" htmlFor="meta_cpa">
                Meta de CPA (R$ máximo por ingresso)
              </label>
              <input
                id="meta_cpa"
                name="meta_cpa"
                inputMode="decimal"
                defaultValue={dinheiroParaCampo(lancamento?.meta_cpa)}
                placeholder="Ex.: 40,00"
                className={CAMPO}
              />
            </div>
            <div>
              <label className="block text-sm text-apagado" htmlFor="inicio_vendas">
                Início das vendas de ingressos
              </label>
              <input
                id="inicio_vendas"
                name="inicio_vendas"
                type="date"
                defaultValue={lancamento?.inicio_vendas ?? ""}
                className={CAMPO}
              />
              <p className="mt-1 text-xs text-apagado">
                Em branco, vale o DV0 (ou o DE0, se não houver DV0).
              </p>
            </div>
            <div>
              <label className="block text-sm text-apagado" htmlFor="fim_vendas">
                Fim das vendas de ingressos
              </label>
              <input
                id="fim_vendas"
                name="fim_vendas"
                type="date"
                defaultValue={lancamento?.fim_vendas ?? ""}
                className={CAMPO}
              />
              <p className="mt-1 text-xs text-apagado">Em branco, vale o D0.</p>
            </div>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="sem_trafego"
              value="true"
              defaultChecked={lancamento?.sem_trafego ?? false}
              className="h-4 w-4 accent-power"
            />
            Sem tráfego pago (não cobra CPA nem aparece como “sem meta”)
          </label>
        </>
      ) : lancamento ? (
        <p className="mt-1 text-sm text-apagado">
          Definidas pelo Ricardo:{" "}
          <span className="text-texto">
            {lancamento.meta_ingressos != null
              ? `${formatarInteiro(lancamento.meta_ingressos)} ingressos`
              : "ingressos sem meta"}
          </span>
          {" · "}
          <span className="text-texto">
            {lancamento.meta_cpa != null
              ? `CPA até ${formatarReal(lancamento.meta_cpa)}`
              : "CPA sem meta"}
          </span>
          {" · vendas de "}
          {formatarData(janelaDeVendas(lancamento).inicio)} a{" "}
          {formatarData(janelaDeVendas(lancamento).fim)}.
        </p>
      ) : (
        <p className="mt-1 text-sm text-apagado">
          As metas de ingressos e de CPA são definidas pelo Ricardo depois que o
          lançamento é criado.
        </p>
      )}

      {resultado.erro ? (
        <p className="mt-4 text-sm text-power-claro" role="alert">
          {resultado.erro}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-power px-5 py-2 font-semibold hover:brightness-125 disabled:opacity-60"
        >
          {salvando ? "Salvando…" : "Salvar lançamento"}
        </button>
        <Link href={voltar} className="text-sm text-apagado hover:text-texto">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
