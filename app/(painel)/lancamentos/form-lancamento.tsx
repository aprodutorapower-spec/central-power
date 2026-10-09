"use client";

import { quando } from "@/lib/conexoes";
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
import {
  janelaDeVendas,
  metasFechadasParaEstrategista,
} from "@/lib/urgencia";
import { Dica } from "../interacoes";
import { salvarLancamento, type ResultadoLancamento } from "./actions";

const CAMPO =
  "mt-1 w-full rounded-lg border border-borda bg-cartao-2 px-3 py-2 outline-none focus:border-power";
const INICIAL: ResultadoLancamento = {};

const EXPLICACAO_VERBA =
  "Quanto será investido em anúncios no lançamento inteiro, do começo ao fim. É diferente da verba investida até agora, que o estrategista informa em cada atualização: o sistema mostra uma contra a outra.";
const EXPLICACAO_META_CPA =
  "Valor máximo que se aceita gastar em anúncio por ingresso vendido pelo tráfego (as vendas orgânicas não entram na conta). Não é obrigatória. Quando preenchida, é ela que vale. Em branco, o sistema usa a régua de mercado: o dobro do ticket médio do ingresso (ingresso + order bumps), calculado sozinho conforme as vendas saem.";

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
  hoje: string;
};

export function FormLancamento({ expertId, lancamento, voltar, admin, hoje }: Props) {
  const [resultado, acao, salvando] = useActionState(salvarLancamento, INICIAL);

  const [tipo, setTipo] = useState<Tipo>(lancamento?.tipo ?? "LPS");
  const [d0, setD0] = useState(lancamento?.d0 ?? "");
  const [dp0, setDp0] = useState(lancamento?.dp0 ?? "");
  const [dfc, setDfc] = useState(lancamento?.dfc ?? "");
  const [semTrafego, setSemTrafego] = useState(lancamento?.sem_trafego ?? false);

  // O estrategista define as metas ao criar e pode corrigir até o início das
  // vendas de ingressos; depois, só o admin.
  const podeMetas =
    admin || !lancamento || !metasFechadasParaEstrategista(lancamento, hoje);
  // Para o estrategista, criar um lançamento sem metas não é permitido.
  const metasObrigatorias = !admin && !lancamento;

  // Mudou o D0 ou o tipo: as datas calculadas são refeitas (e seguem editáveis).
  function recalcular(novoTipo: Tipo, novoD0: string) {
    if (!novoD0) return;
    const sugerido = calcularMarcos(novoTipo, novoD0);
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
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
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
      {podeMetas ? (
        <>
          <p className="text-xs text-apagado">
            {admin
              ? "O estrategista preenche ao criar e pode corrigir até o início das vendas de ingressos. Depois disso, só o admin altera."
              : "Você define agora e pode corrigir até o início das vendas de ingressos (DV0). Depois disso, só o Ricardo altera."}
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
                required={metasObrigatorias}
                defaultValue={lancamento?.meta_ingressos ?? ""}
                placeholder="Ex.: 300"
                className={CAMPO}
              />
            </div>
            <div>
              <div className="relative flex items-center gap-1.5 text-sm text-apagado">
                <label htmlFor="meta_cpa">Meta de CPA (R$), opcional</label>
                <Dica texto={EXPLICACAO_META_CPA} />
              </div>
              <input
                id="meta_cpa"
                name="meta_cpa"
                inputMode="decimal"
                disabled={semTrafego}
                defaultValue={dinheiroParaCampo(lancamento?.meta_cpa)}
                placeholder={semTrafego ? "Não se aplica" : "Em branco: o dobro do ticket"}
                className={CAMPO}
              />
            </div>
            <div>
              <div className="relative flex items-center gap-1.5 text-sm text-apagado">
                <label htmlFor="verba_prevista">Verba total prevista (R$), opcional</label>
                <Dica texto={EXPLICACAO_VERBA} />
              </div>
              <input
                id="verba_prevista"
                name="verba_prevista"
                inputMode="decimal"
                disabled={semTrafego}
                defaultValue={dinheiroParaCampo(lancamento?.verba_prevista)}
                placeholder={semTrafego ? "Não se aplica" : "Ex.: 15.000,00"}
                className={CAMPO}
              />
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
              <p className="mt-1 text-xs text-apagado">
                Em branco, vale o D0. O início é o DV0, logo acima.
              </p>
            </div>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="sem_trafego"
              value="true"
              checked={semTrafego}
              onChange={(evento) => setSemTrafego(evento.target.checked)}
              className="h-4 w-4 accent-power"
            />
            Sem tráfego pago (não cobra CPA nem aparece como “sem meta”)
          </label>
        </>
      ) : (
        <p className="mt-1 text-sm text-apagado">
          As vendas de ingressos já começaram, então só o Ricardo altera:{" "}
          <span className="text-texto">
            {lancamento?.meta_ingressos != null
              ? `${formatarInteiro(lancamento.meta_ingressos)} ingressos`
              : "ingressos sem meta"}
          </span>
          {" · "}
          <span className="text-texto">
            {lancamento?.sem_trafego
              ? "sem tráfego pago"
              : lancamento?.meta_cpa != null
                ? `CPA até ${formatarReal(lancamento.meta_cpa)}`
                : "CPA até o dobro do ticket médio das vendas"}
          </span>
          {lancamento?.verba_prevista != null ? (
            <>
              {" · verba total prevista de "}
              <span className="text-texto">{formatarReal(lancamento.verba_prevista)}</span>
            </>
          ) : null}
          {lancamento ? (
            <>
              {" · vendas de "}
              {formatarData(janelaDeVendas(lancamento).inicio)} a{" "}
              {formatarData(janelaDeVendas(lancamento).fim)}.
            </>
          ) : null}
        </p>
      )}

      {admin ? (
        <>
          <p className="mt-6 text-sm font-semibold">Verba pelo Meta Ads</p>
          <p className="text-xs text-apagado">
            Preenchido, a verba investida é atualizada sozinha 3x ao dia. Só o
            admin vê e altera.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-apagado" htmlFor="meta_conta_id">
                Conta de anúncios (número)
              </label>
              <input
                id="meta_conta_id"
                name="meta_conta_id"
                inputMode="numeric"
                defaultValue={lancamento?.meta_conta_id ?? ""}
                placeholder="Ex.: 553760696950014"
                className={CAMPO}
              />
            </div>
            <div>
              <label className="block text-sm text-apagado" htmlFor="meta_desde">
                Contar a verba a partir de
              </label>
              <input
                id="meta_desde"
                name="meta_desde"
                type="date"
                defaultValue={lancamento?.meta_desde ?? ""}
                className={CAMPO}
              />
              <p className="mt-1 text-xs text-apagado">Em branco, vale o início das vendas.</p>
            </div>
            <div className="sm:col-span-2">
              <div className="relative flex items-center gap-1.5 text-sm text-apagado">
                <label htmlFor="meta_filtro">Palavras no nome das campanhas</label>
                <Dica texto="Separe por vírgula. Só entram na verba as campanhas cujo nome tem todas as palavras. Exemplo: “Vendas, 31/10 - LCTO” soma as campanhas de venda desse lançamento e deixa de fora as de outros produtos, posts impulsionados e campanhas de visualização." />
              </div>
              <input
                id="meta_filtro"
                name="meta_filtro"
                defaultValue={lancamento?.meta_filtro ?? ""}
                placeholder="Ex.: Vendas, 31/10 - LCTO"
                className={CAMPO}
              />
            </div>
          </div>
          {lancamento?.meta_conta_id && lancamento.meta_filtro ? (
            <p className="mt-3 rounded-lg bg-cartao-2 px-3 py-2 text-sm" role="status">
              {lancamento.meta_erro ? (
                <>
                  <span className="text-power-claro">Última tentativa com erro:</span>{" "}
                  {lancamento.meta_erro}.
                </>
              ) : lancamento.meta_conferido_em ? (
                <>
                  Última leitura em {quando(lancamento.meta_conferido_em)}
                  {lancamento.meta_campanhas != null
                    ? `: ${lancamento.meta_campanhas} ${
                        lancamento.meta_campanhas === 1
                          ? "campanha somada"
                          : "campanhas somadas"
                      }`
                    : ""}
                  .
                </>
              ) : (
                "Ainda sem leitura. A primeira vem na próxima rodada (9h10, 12h10 ou 18h10); se a conta ou o filtro estiverem errados, o motivo aparece aqui."
              )}
            </p>
          ) : null}
        </>
      ) : null}

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
