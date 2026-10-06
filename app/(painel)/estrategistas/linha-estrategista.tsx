"use client";

import { useActionState, useState } from "react";
import { gerarLinkDeAcesso, type ResultadoAcesso } from "./actions";

type Props = {
  id: string;
  nome: string;
  email: string | null;
  situacao: "pendente" | "convidado" | "ativo";
  experts: number;
};

const INICIAL: ResultadoAcesso = {};

const SITUACOES = {
  pendente: { rotulo: "Pendente", cor: "border-borda text-apagado" },
  convidado: { rotulo: "Convidado", cor: "border-apagado text-texto" },
  ativo: { rotulo: "Ativo", cor: "border-power bg-power text-texto" },
};

export function LinhaEstrategista({ id, nome, email, situacao, experts }: Props) {
  const [resultado, acao, enviando] = useActionState(gerarLinkDeAcesso, INICIAL);
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    if (!resultado.link) return;
    await navigator.clipboard.writeText(resultado.link);
    setCopiado(true);
  }

  return (
    <li className="rounded-xl border border-borda bg-cartao p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">{nome}</h2>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-apagado">
            {experts} {experts === 1 ? "expert" : "experts"}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 ${SITUACOES[situacao].cor}`}
          >
            {SITUACOES[situacao].rotulo}
          </span>
        </div>
      </div>

      <form action={acao} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="perfil_id" value={id} />
        <input
          name="email"
          type="email"
          required
          defaultValue={email ?? ""}
          placeholder="E-mail do estrategista"
          aria-label={`E-mail de ${nome}`}
          className="w-full rounded-lg border border-borda bg-cartao-2 px-3 py-2 outline-none focus:border-power"
        />
        <button
          type="submit"
          disabled={enviando}
          className="shrink-0 rounded-lg bg-power px-4 py-2 font-semibold hover:brightness-125 disabled:opacity-60"
        >
          {enviando
            ? "Gerando…"
            : situacao === "pendente"
              ? "Gerar link de acesso"
              : "Gerar novo link"}
        </button>
      </form>

      {resultado.erro ? (
        <p className="mt-3 text-sm text-power-claro" role="alert">
          {resultado.erro}
        </p>
      ) : null}

      {resultado.link ? (
        <div className="mt-3 rounded-lg border border-borda bg-cartao-2 p-3">
          <p className="text-sm text-apagado">
            Envie este link para {nome} (WhatsApp, por exemplo). Vale por 24 horas
            e só funciona uma vez.
          </p>
          <p className="mt-2 break-all font-mono text-xs">{resultado.link}</p>
          <button
            type="button"
            onClick={copiar}
            className="mt-3 rounded-lg border border-borda px-3 py-1.5 text-sm hover:border-power"
          >
            {copiado ? "Copiado" : "Copiar link"}
          </button>
        </div>
      ) : null}
    </li>
  );
}
