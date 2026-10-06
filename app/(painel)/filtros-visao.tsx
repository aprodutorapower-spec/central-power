"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type Opcao = { valor: string; rotulo: string };
type Props = { estrategistas: Opcao[] };

const STATUS: Opcao[] = [
  { valor: "vermelho", rotulo: "Em risco" },
  { valor: "amarelo", rotulo: "Atenção" },
  { valor: "verde", rotulo: "No trilho" },
  { valor: "sem", rotulo: "Sem atualização" },
];
const TIPOS: Opcao[] = [
  { valor: "LP", rotulo: "LP" },
  { valor: "LPS", rotulo: "LPS" },
];

// Os filtros vivem no endereço da página: dá para salvar ou compartilhar a visão.
export function FiltrosVisao({ estrategistas }: Props) {
  const router = useRouter();
  const caminho = usePathname();
  const parametros = useSearchParams();
  const [carregando, iniciar] = useTransition();

  function definir(chave: string, valor: string) {
    const novos = new URLSearchParams(parametros);
    if (valor) novos.set(chave, valor);
    else novos.delete(chave);
    iniciar(() => router.replace(`${caminho}?${novos}`, { scroll: false }));
  }

  const modo = parametros.get("modo") === "estrategista" ? "estrategista" : "prioridades";

  const seletor = (chave: string, todos: string, opcoes: Opcao[]) => (
    <select
      value={parametros.get(chave) ?? ""}
      onChange={(evento) => definir(chave, evento.target.value)}
      aria-label={todos}
      className="rounded-lg border border-borda bg-cartao-2 px-3 py-2 text-sm outline-none focus:border-power"
    >
      <option value="">{todos}</option>
      {opcoes.map((opcao) => (
        <option key={opcao.valor} value={opcao.valor}>
          {opcao.rotulo}
        </option>
      ))}
    </select>
  );

  return (
    <div
      className={`mt-6 flex flex-wrap items-center gap-2 transition ${
        carregando ? "opacity-60" : ""
      }`}
    >
      <div className="mr-2 flex overflow-hidden rounded-lg border border-borda text-sm">
        {[
          { valor: "prioridades", rotulo: "Prioridades" },
          { valor: "estrategista", rotulo: "Por estrategista" },
        ].map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            onClick={() => definir("modo", opcao.valor === "prioridades" ? "" : opcao.valor)}
            className={`px-3 py-2 ${
              modo === opcao.valor ? "bg-power font-semibold" : "hover:bg-cartao-2"
            }`}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>
      {seletor("estrategista", "Todos os estrategistas", estrategistas)}
      {seletor("status", "Todos os status", STATUS)}
      {seletor("tipo", "LP e LPS", TIPOS)}
    </div>
  );
}
