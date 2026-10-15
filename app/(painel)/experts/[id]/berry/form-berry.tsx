"use client";

import { useActionState, useState } from "react";
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

type Escolhido = { id: string; nome: string };

function Caixas({
  nome,
  titulo,
  ajuda,
  produtos,
  marcados,
  fora,
}: {
  nome: string;
  titulo: string;
  ajuda: string;
  produtos: ProdutoBerry[];
  marcados: Escolhido[];
  // Produto que não pode ser marcado aqui (o do ingresso).
  fora: string;
}) {
  const opcoes = produtos.filter((produto) => produto.id !== fora);
  if (!opcoes.length) return null;
  return (
    <fieldset className="mt-4">
      <legend className="text-sm font-semibold">{titulo}</legend>
      <p className="text-xs text-apagado">{ajuda}</p>
      <div className="mt-2 grid gap-1.5">
        {opcoes.map((produto) => (
          <label key={produto.id} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name={nome}
              value={produto.id}
              defaultChecked={marcados.some((m) => m.id === produto.id)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-power"
            />
            <span>
              {produto.nome}
              {produto.ativo ? "" : " (inativo na Berry)"}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function SeletorProduto({
  lancamentoId,
  lancamentoNome,
  atual,
  extras,
  principais,
  gratuito,
  produtos,
}: {
  lancamentoId: string;
  lancamentoNome: string;
  atual: string | null;
  extras: Escolhido[];
  principais: Escolhido[];
  // Gratuito e Black não vendem ingresso: só escolhem o produto principal.
  gratuito: boolean;
  produtos: ProdutoBerry[];
}) {
  const [resultado, acao, salvando] = useActionState(definirProdutoBerry, INICIAL);
  const [ingresso, setIngresso] = useState(atual ?? "");

  return (
    <form action={acao}>
      <input type="hidden" name="lancamento_id" value={lancamentoId} />
      {gratuito ? null : (
        <>
          <label className="text-sm font-semibold" htmlFor={`produto-${lancamentoId}`}>
            Produto do ingresso
          </label>
          <select
            id={`produto-${lancamentoId}`}
            name="produto_id"
            value={ingresso}
            onChange={(evento) => setIngresso(evento.target.value)}
            aria-label={`Produto do ingresso de ${lancamentoNome}`}
            className={`mt-1 ${CAMPO}`}
          >
            <option value="">Nenhum produto escolhido</option>
            {produtos.map((produto) => (
              <option key={produto.id} value={produto.id}>
                {produto.nome}
                {produto.ativo ? "" : " (inativo na Berry)"}
              </option>
            ))}
          </select>
          {ingresso ? (
            <Caixas
              nome="extras"
              titulo="Também somam na receita de ingressos"
              ajuda="Gravação e outros produtos vendidos junto ou à parte. Entram na receita e no ROI de ingressos. Order bump comprado junto com o ingresso já é contado sozinho, e nenhuma compra é somada duas vezes."
              produtos={produtos}
              marcados={extras}
              fora={ingresso}
            />
          ) : null}
        </>
      )}
      <Caixas
        nome="principais"
        titulo="Produto principal"
        ajuda="O que é vendido no evento. Com ele o sistema mostra as vendas, o faturamento e o CAC (verba ÷ vendas), contando do dia do evento ou do pitch até o fim do carrinho."
        produtos={produtos}
        marcados={principais}
        fora={ingresso}
      />
      <button type="submit" disabled={salvando} className={`mt-4 ${BOTAO}`}>
        {salvando ? "Salvando…" : "Salvar produtos"}
      </button>
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
