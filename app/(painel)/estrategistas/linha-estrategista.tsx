"use client";

import { useActionState, useState } from "react";
import {
  criarEstrategista,
  definirSenha,
  excluirEstrategista,
  gerarLinkDeAcesso,
  type ResultadoAcesso,
  type ResultadoEstrategista,
  type ResultadoSenha,
} from "./actions";

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

const SEM_RESULTADO: ResultadoEstrategista = {};

// Campo no topo da tela para incluir um estrategista novo.
export function NovoEstrategista() {
  const [resultado, acao, enviando] = useActionState(criarEstrategista, SEM_RESULTADO);

  return (
    <form action={acao} className="mt-6 max-w-md">
      <div className="flex gap-2">
        <input
          name="nome"
          required
          // Limpa o campo depois de adicionar.
          key={resultado.ok ? "limpo" : "digitando"}
          placeholder="Nome do novo estrategista"
          aria-label="Nome do novo estrategista"
          className="w-full rounded-lg border border-borda bg-cartao-2 px-3 py-2 outline-none focus:border-power"
        />
        <button
          type="submit"
          disabled={enviando}
          className="shrink-0 rounded-lg bg-power px-4 py-2 font-semibold hover:brightness-125 disabled:opacity-60"
        >
          {enviando ? "Adicionando…" : "Adicionar"}
        </button>
      </div>
      {resultado.erro ? (
        <p className="mt-2 text-sm text-power-claro" role="alert">
          {resultado.erro}
        </p>
      ) : null}
    </form>
  );
}

export function LinhaEstrategista({ id, nome, email, situacao, experts }: Props) {
  const [resultado, acao, enviando] = useActionState(gerarLinkDeAcesso, INICIAL);
  const [copiado, setCopiado] = useState(false);
  const [exclusao, excluir, excluindo] = useActionState(excluirEstrategista, SEM_RESULTADO);
  const [confirmando, setConfirmando] = useState(false);
  const [senha, acaoSenha, salvandoSenha] = useActionState(definirSenha, {} as ResultadoSenha);
  const [definindo, setDefinindo] = useState(false);

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

      {/* Senha definida pelo admin: o caminho rápido quando o link não deu certo. */}
      <div className="mt-3 text-sm">
        {definindo ? (
          <form action={acaoSenha} className="flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="perfil_id" value={id} />
            <input
              name="senha"
              type="text"
              minLength={8}
              required
              autoComplete="off"
              placeholder="Nova senha (mínimo 8 caracteres)"
              aria-label={`Nova senha de ${nome}`}
              className="w-full rounded-lg border border-borda bg-cartao-2 px-3 py-2 outline-none focus:border-power"
            />
            <button
              type="submit"
              disabled={salvandoSenha}
              className="shrink-0 rounded-lg border border-borda px-4 py-2 hover:border-power disabled:opacity-60"
            >
              {salvandoSenha ? "Salvando…" : "Salvar senha"}
            </button>
            <button
              type="button"
              onClick={() => setDefinindo(false)}
              className="text-apagado hover:text-texto"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setDefinindo(true)}
            className="text-apagado hover:text-texto"
          >
            Definir a senha dele
          </button>
        )}
        {senha.erro ? (
          <p className="mt-2 text-power-claro" role="alert">
            {senha.erro}
          </p>
        ) : null}
        {senha.ok ? (
          <p className="mt-2 text-ok" role="status">
            {senha.ok}
          </p>
        ) : null}
      </div>

      <div className="mt-4 border-t border-borda pt-3 text-sm">
        {confirmando ? (
          <form action={excluir}>
            <input type="hidden" name="perfil_id" value={id} />
            <p>
              Excluir {nome}? O acesso dele é apagado na hora e não dá para desfazer.{" "}
              {experts === 0
                ? "Ele não tem experts."
                : experts === 1
                  ? "O expert dele continua no sistema, sem responsável, até você escolher outro em Experts."
                  : `Os ${experts} experts dele continuam no sistema, sem responsável, até você escolher outro em Experts.`}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={excluindo}
                className="rounded-lg bg-power px-3 py-1.5 font-semibold hover:brightness-125 disabled:opacity-60"
              >
                {excluindo ? "Excluindo…" : `Sim, excluir ${nome}`}
              </button>
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="text-apagado hover:text-texto"
              >
                Cancelar
              </button>
            </div>
            {exclusao.erro ? (
              <p className="mt-2 text-power-claro" role="alert">
                {exclusao.erro}
              </p>
            ) : null}
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="text-apagado hover:text-power-claro"
          >
            Excluir estrategista
          </button>
        )}
      </div>
    </li>
  );
}
