"use client";

import { useTransition } from "react";
import { trocarResponsavel } from "./actions";

type Props = {
  expertId: string;
  expertNome: string;
  atual: string | null;
  estrategistas: { id: string; nome: string }[];
};

// Escolheu outro nome, já troca: sem botão separado.
export function SeletorResponsavel({ expertId, expertNome, atual, estrategistas }: Props) {
  const [trocando, iniciar] = useTransition();

  return (
    <select
      value={atual ?? ""}
      disabled={trocando}
      aria-label={`Responsável por ${expertNome}`}
      onChange={(evento) => {
        const dados = new FormData();
        dados.set("id", expertId);
        dados.set("estrategista_id", evento.target.value);
        iniciar(() => trocarResponsavel(dados));
      }}
      className="rounded-lg border border-borda bg-cartao-2 px-2 py-1 text-xs outline-none focus:border-power disabled:cursor-wait disabled:opacity-50"
    >
      <option value="">Sem responsável</option>
      {estrategistas.map((estrategista) => (
        <option key={estrategista.id} value={estrategista.id}>
          {estrategista.nome}
        </option>
      ))}
    </select>
  );
}
