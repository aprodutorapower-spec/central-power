"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Pequenas peças que precisam do navegador: menu, voltar, copiar e painel lateral.

export function Menu({ itens }: { itens: { href: string; rotulo: string }[] }) {
  // A página de um estrategista é o segundo nível da visão geral.
  const caminho = usePathname().replace(/^\/estrategistas\/.+/, "/");
  // Marca o item mais específico que bate com a página atual.
  const atual = itens
    .filter((item) =>
      item.href === "/" ? caminho === "/" : caminho.startsWith(item.href),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <nav className="flex w-full flex-wrap gap-x-5 gap-y-2 text-sm">
      {itens.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item === atual ? "page" : undefined}
          className={
            item === atual
              ? "border-b-2 border-power pb-0.5 font-semibold"
              : "pb-0.5 text-apagado hover:text-texto"
          }
        >
          {item.rotulo}
        </Link>
      ))}
    </nav>
  );
}

// Chaves do navegador usadas para devolver a tela na mesma altura ao voltar.
const ROLAGEM = "rolagem:";
const RESTAURAR = "restaurar-rolagem";

// Colocado numa página, guarda a altura da rolagem a cada clique. Quando a
// pessoa volta por um BotaoVoltar, a página reabre na mesma altura (mesmo que
// os dados tenham sido recarregados no caminho).
export function LembrarRolagem() {
  const caminho = usePathname();

  useEffect(() => {
    if (sessionStorage.getItem(RESTAURAR) === caminho) {
      window.scrollTo(0, Number(sessionStorage.getItem(ROLAGEM + caminho) ?? 0));
    }
    sessionStorage.removeItem(RESTAURAR);

    const guardar = () =>
      sessionStorage.setItem(ROLAGEM + caminho, String(window.scrollY));
    document.addEventListener("click", guardar, true);
    return () => document.removeEventListener("click", guardar, true);
  }, [caminho]);

  return null;
}

// Volta para a tela anterior pedindo que ela reabra na mesma altura.
export function BotaoVoltar({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      onClick={() => sessionStorage.setItem(RESTAURAR, href)}
      className="text-sm text-apagado hover:text-texto"
    >
      {children}
    </Link>
  );
}

export function BotaoCopiar({
  texto,
  children,
  className = "",
}: {
  texto: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  return (
    <button type="button" onClick={copiar} className={className}>
      {copiado ? "✓ Copiado, é só colar" : children}
    </button>
  );
}

// Cartão que, ao ser clicado, abre um painel que desliza da direita, sem
// trocar de página. Cartão e painel vêm prontos do servidor; aqui só abre e
// fecha. Links, botões e campos dentro do cartão continuam funcionando; um
// botão com data-abre-painel também abre o painel.
export function CartaoComPainel({
  titulo,
  painel,
  className = "",
  children,
}: {
  titulo: string;
  painel: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  function aoClicar(evento: React.MouseEvent<HTMLLIElement>) {
    const alvo = evento.target as HTMLElement;
    if (alvo.closest("dialog")) return;
    if (alvo.closest("a, button:not([data-abre-painel]), input, select, summary")) return;
    ref.current?.showModal();
  }

  return (
    <li onClick={aoClicar} className={`cursor-pointer ${className}`}>
      {children}
      <dialog
        ref={ref}
        aria-label={titulo}
        // Clique no fundo escuro (fora do painel) fecha.
        onClick={(evento) => {
          if (evento.target === ref.current) ref.current?.close();
        }}
        className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-dvh w-full max-w-xl cursor-auto overflow-y-auto border-l border-borda bg-fundo p-0 text-texto backdrop:bg-black/70"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-borda bg-cartao px-5 py-4">
          <h2 className="font-semibold">{titulo}</h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="rounded-lg border border-borda px-3 py-1.5 text-sm hover:border-power"
          >
            Fechar
          </button>
        </div>
        <div className="p-5">{painel}</div>
      </dialog>
    </li>
  );
}
