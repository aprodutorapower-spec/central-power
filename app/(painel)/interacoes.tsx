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
    let tentativa = 0;
    let quadro = 0;
    if (sessionStorage.getItem(RESTAURAR) === caminho) {
      const alvo = Number(sessionStorage.getItem(ROLAGEM + caminho) ?? 0);
      // A página pode ainda estar terminando de se montar (ou o navegador
      // pode jogar a rolagem para o topo logo depois): insiste por alguns
      // instantes até a altura ficar certa.
      const rolar = () => {
        window.scrollTo(0, alvo);
        tentativa += 1;
        if (tentativa < 30) quadro = requestAnimationFrame(rolar);
      };
      rolar();
    }
    sessionStorage.removeItem(RESTAURAR);

    // O sistema pode manter esta página viva em segundo plano depois que a
    // pessoa sai dela; só guarda a altura se ela ainda for a página na tela.
    const guardar = () => {
      if (window.location.pathname !== caminho) return;
      sessionStorage.setItem(ROLAGEM + caminho, String(window.scrollY));
    };
    document.addEventListener("click", guardar, true);
    return () => {
      cancelAnimationFrame(quadro);
      document.removeEventListener("click", guardar, true);
    };
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

// Cartão que, ao ser clicado, abre uma janela no meio da tela, sem trocar de
// página. Cartão e janela vêm prontos do servidor; aqui só abre e fecha. Links, botões e campos dentro do cartão continuam funcionando; um
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
        // Clique no fundo escuro (fora da janela) fecha.
        onClick={(evento) => {
          if (evento.target === ref.current) ref.current?.close();
        }}
        className="fixed inset-0 m-auto h-fit max-h-[85dvh] w-[calc(100%-2rem)] max-w-3xl cursor-auto overflow-y-auto rounded-xl border border-borda bg-fundo p-0 text-texto backdrop:bg-black/70"
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

// "?" ao lado de um rótulo: mostra uma explicação curta ao passar o mouse ou
// tocar. Quem usa precisa estar dentro de um elemento com "relative".
export function Dica({ texto }: { texto: string }) {
  const [aberta, setAberta] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  // Aberta por toque ou clique, fecha ao tocar fora ou apertar Esc.
  useEffect(() => {
    if (!aberta) return;
    const fora = (evento: Event) => {
      if (!ref.current?.contains(evento.target as Node)) setAberta(false);
    };
    const tecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAberta(false);
    };
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", tecla);
    };
  }, [aberta]);

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label="O que é isto?"
        aria-expanded={aberta}
        onClick={() => setAberta((antes) => !antes)}
        // Só o mouse abre ao passar por cima; no toque, quem abre é o clique.
        onPointerEnter={(evento) => evento.pointerType === "mouse" && setAberta(true)}
        onPointerLeave={(evento) => evento.pointerType === "mouse" && setAberta(false)}
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-apagado text-[10px] leading-none text-apagado hover:border-texto hover:text-texto"
      >
        ?
      </button>
      {aberta ? (
        <span
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1 w-72 max-w-[80vw] rounded-lg border border-borda bg-cartao-2 p-3 text-sm leading-snug text-texto shadow-lg shadow-black/50"
        >
          {texto}
        </span>
      ) : null}
    </>
  );
}
