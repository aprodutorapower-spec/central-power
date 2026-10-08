"use client";

import { useActionState } from "react";
import type { ProdutoBerry } from "@/lib/berry";
import {
  conectarBerry,
  definirProdutoBerry,
  type ResultadoBerry,
} from "./actions";

const CAMPO =
  "w-full rounded-lg border border-borda bg-cartao-2 px-3 py-2 outline-none focus:border-power";
const BOTAO =
  "shrink-0 rounded-lg bg-power px-4 py-2 font-semibold transition hover:brightness-125 disabled:cursor-wait disabled:opacity-50";
const INICIAL: ResultadoBerry = {};

export function FormChave({
  expertId,
  trocando = false,
}: {
  expertId: string;
  trocando?: boolean;
}) {
  const [resultado, acao, enviando] = useActionState(conectarBerry, INICIAL);

  return (
    <form action={acao}>
      <input type="hidden" name="expert_id" value={expertId} />
      <label htmlFor="chave" className="text-sm text-apagado">
        {trocando ? "Nova chave de API da Berry" : "Chave de API da Berry"}
      </label>
      <div className="mt-1 flex flex-col gap-2 sm:flex-row">
        <input
          id="chave"
          name="chave"
          type="password"
          required
          autoComplete="off"
          placeholder="bp_live_…"
          className={`font-mono ${CAMPO}`}
        />
        <button type="submit" disabled={enviando} className={BOTAO}>
          {enviando ? "Conferindo na Berry…" : trocando ? "Trocar chave" : "Conectar"}
        </button>
      </div>
      {resultado.erro ? (
        <p className="mt-3 text-sm text-power-claro" role="alert">
          {resultado.erro}
        </p>
      ) : null}
    </form>
  );
}

export function SeletorProduto({
  lancamentoId,
  lancamentoNome,
  atual,
  produtos,
}: {
  lancamentoId: string;
  lancamentoNome: string;
  atual: string | null;
  produtos: ProdutoBerry[];
}) {
  const [resultado, acao, salvando] = useActionState(definirProdutoBerry, INICIAL);

  return (
    <form action={acao}>
      <input type="hidden" name="lancamento_id" value={lancamentoId} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          name="produto_id"
          defaultValue={atual ?? ""}
          aria-label={`Produto do ingresso de ${lancamentoNome}`}
          className={CAMPO}
        >
          <option value="">Nenhum produto escolhido</option>
          {produtos.map((produto) => (
            <option key={produto.id} value={produto.id}>
              {produto.nome}
              {produto.ativo ? "" : " (inativo na Berry)"}
            </option>
          ))}
        </select>
        <button type="submit" disabled={salvando} className={BOTAO}>
          {salvando ? "Salvando…" : "Salvar"}
        </button>
      </div>
      {resultado.erro ? (
        <p className="mt-2 text-sm text-power-claro" role="alert">
          {resultado.erro}
        </p>
      ) : null}
      {resultado.conferido ? (
        <p className="mt-2 text-sm text-ok" role="status">
          {resultado.conferido}
        </p>
      ) : null}
    </form>
  );
}
