"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  atualizarPelaBerry,
  atualizarPeloMeta,
  excluirLancamento,
  testarContaMeta,
} from "./lancamentos/actions";

// Pequenas peças que precisam do navegador: menu, voltar, copiar e painel lateral.

type ItemMenu = {
  href: string;
  rotulo: string;
  curto?: string;
  icone: keyof typeof ICONES;
};

const ICONES = {
  inicio: "M3 12 12 4l9 8M5 10v10h14V10",
  experts: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0",
  pessoas:
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7M18 14.5a7 7 0 0 1 4 6.5",
  modelos: "M9 6h12M9 12h12M9 18h12M3 6l1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2",
};

// Marca o item mais específico que bate com a página atual.
function itemAtual(itens: ItemMenu[], pagina: string) {
  // A página de um estrategista é o segundo nível da visão geral.
  const caminho = pagina.replace(/^\/estrategistas\/.+/, "/");
  return itens
    .filter((item) =>
      item.href === "/" ? caminho === "/" : caminho.startsWith(item.href),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
}

// Do tablet para cima o menu fica no topo; no celular quem navega é o MenuInferior.
export function Menu({ itens }: { itens: ItemMenu[] }) {
  const atual = itemAtual(itens, usePathname());

  return (
    <nav className="hidden w-full flex-wrap gap-x-5 gap-y-2 text-sm md:flex">
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

// Barra fixa embaixo, ao alcance do polegar, como num aplicativo.
export function MenuInferior({ itens }: { itens: ItemMenu[] }) {
  const atual = itemAtual(itens, usePathname());

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-borda bg-cartao pb-[env(safe-area-inset-bottom)] md:hidden">
      {itens.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item === atual ? "page" : undefined}
          className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 border-t-2 px-1 text-[11px] ${
            item === atual
              ? "border-power font-semibold text-texto"
              : "border-transparent text-apagado"
          }`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={ICONES[item.icone]} />
          </svg>
          <span className="max-w-full truncate">{item.curto ?? item.rotulo}</span>
        </Link>
      ))}
    </nav>
  );
}

// Aberto pelo atalho da tela inicial, o iPhone não tem "puxar para atualizar":
// quem volta para o aplicativo depois de um tempo recebe os números do momento.
const MINUTOS_PARA_ATUALIZAR = 5;

export function AtualizarAoVoltar() {
  const router = useRouter();

  useEffect(() => {
    let saiuEm = 0;
    const mudou = () => {
      if (document.hidden) {
        saiuEm = Date.now();
      } else if (saiuEm && Date.now() - saiuEm > MINUTOS_PARA_ATUALIZAR * 60_000) {
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", mudou);
    return () => document.removeEventListener("visibilitychange", mudou);
  }, [router]);

  return null;
}

// O Android entrega um pedido de instalação que pode ser disparado por botão;
// o iPhone não tem isso, só o caminho manual pelo Compartilhar.
type PedidoInstalacao = Event & { prompt: () => Promise<void> };
const CONVITE_DISPENSADO = "convite-instalar-dispensado";

function conviteDispensado() {
  try {
    return localStorage.getItem(CONVITE_DISPENSADO) === "sim";
  } catch {
    return false;
  }
}

// Convite para colocar a Central na tela inicial. No topo das páginas só em
// telas de toque e até a pessoa dispensar; com `sempre`, fica em Minha conta.
export function ConviteInstalar({ sempre = false }: { sempre?: boolean }) {
  const [estado, setEstado] = useState<"oculto" | "iphone" | "android">("oculto");
  const [pedido, setPedido] = useState<PedidoInstalacao | null>(null);

  useEffect(() => {
    const instalado =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const toque = window.matchMedia("(pointer: coarse)").matches;
    if (instalado || !toque || (!sempre && conviteDispensado())) return;

    // iPad recente se apresenta como Mac; o toque é o que o diferencia.
    const iphone = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
    const inicio = requestAnimationFrame(() => setEstado(iphone ? "iphone" : "android"));
    const guardar = (evento: Event) => {
      evento.preventDefault();
      setPedido(evento as PedidoInstalacao);
    };
    window.addEventListener("beforeinstallprompt", guardar);
    return () => {
      cancelAnimationFrame(inicio);
      window.removeEventListener("beforeinstallprompt", guardar);
    };
  }, [sempre]);

  if (estado === "oculto") return null;

  const dispensar = () => {
    try {
      localStorage.setItem(CONVITE_DISPENSADO, "sim");
    } catch {}
    setEstado("oculto");
  };

  return (
    <aside className={`rounded-xl border border-borda bg-cartao p-4 text-sm ${sempre ? "mt-6" : "mb-6"}`}>
      <p className="font-semibold">Coloque a Central na tela inicial</p>
      {pedido ? (
        <p className="mt-1 text-apagado">Ela abre direto, como um aplicativo.</p>
      ) : estado === "iphone" ? (
        <p className="mt-1 text-apagado">
          No Safari, toque em Compartilhar (o quadrado com a seta) e depois em
          &ldquo;Adicionar à Tela de Início&rdquo;.
        </p>
      ) : (
        <p className="mt-1 text-apagado">
          No menu do navegador (os três pontinhos), toque em &ldquo;Instalar
          app&rdquo; ou &ldquo;Adicionar à tela inicial&rdquo;.
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {pedido ? (
          <button
            type="button"
            onClick={() => pedido.prompt()}
            className="rounded-lg bg-power px-4 py-2 font-semibold hover:brightness-125"
          >
            Instalar
          </button>
        ) : null}
        {sempre ? null : (
          <button
            type="button"
            onClick={dispensar}
            className="rounded-lg border border-borda px-4 py-2 hover:border-power"
          >
            Agora não
          </button>
        )}
      </div>
    </aside>
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
  id,
  titulo,
  painel,
  className = "",
  children,
}: {
  id?: string;
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
    <li id={id} onClick={aoClicar} className={`cursor-pointer ${className}`}>
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
        className="toque-livre relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-apagado text-[10px] leading-none text-apagado after:absolute after:-inset-3 hover:border-texto hover:text-texto"
      >
        ?
      </button>
      {aberta ? (
        <span
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1 w-72 max-w-[80vw] rounded-lg max-md:fixed max-md:inset-x-4 max-md:bottom-24 max-md:top-auto max-md:left-4 max-md:w-auto max-md:max-w-none border border-borda bg-cartao-2 p-3 text-sm leading-snug text-texto shadow-lg shadow-black/50"
        >
          {texto}
        </span>
      ) : null}
    </>
  );
}

// Puxa da Berry, na hora, os ingressos e a receita do lançamento.
export function BotaoBerry({ lancamentoId }: { lancamentoId: string }) {
  const [resultado, acao, puxando] = useActionState(atualizarPelaBerry, {});

  return (
    <form action={acao} className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <input type="hidden" name="lancamento_id" value={lancamentoId} />
      <button
        type="submit"
        disabled={puxando}
        className="rounded-lg border border-borda px-3 py-1.5 transition hover:border-power disabled:cursor-wait disabled:opacity-50"
      >
        {puxando ? "Consultando a Berry…" : "Atualizar pela Berry agora"}
      </button>
      {resultado.erro ? (
        <span className="text-power-claro" role="alert">
          {resultado.erro}
        </span>
      ) : null}
      {resultado.ok && !puxando ? (
        <span className="text-ok" role="status">
          Números da Berry conferidos.
        </span>
      ) : null}
    </form>
  );
}

// Pede uma rodada fora de hora à rotina do Meta Ads. Ela leva cerca de um
// minuto: a tela se atualiza sozinha algumas vezes até a verba chegar.
export function BotaoMeta({ lancamentoId }: { lancamentoId: string }) {
  const [resultado, acao, pedindo] = useActionState(atualizarPeloMeta, {});
  const router = useRouter();
  const aguardando = Boolean(resultado.pedido || resultado.recente) && !pedindo;

  useEffect(() => {
    if (!aguardando) return;
    const esperas = [45_000, 75_000, 120_000].map((ms) =>
      setTimeout(() => router.refresh(), ms),
    );
    return () => esperas.forEach(clearTimeout);
  }, [aguardando, resultado, router]);

  return (
    <form action={acao} className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <input type="hidden" name="lancamento_id" value={lancamentoId} />
      <button
        type="submit"
        disabled={pedindo}
        className="rounded-lg border border-borda px-3 py-1.5 transition hover:border-power disabled:cursor-wait disabled:opacity-50"
      >
        {pedindo ? "Pedindo ao Meta Ads…" : "Atualizar pelo Meta Ads agora"}
      </button>
      {resultado.erro ? (
        <span className="text-power-claro" role="alert">
          {resultado.erro}
        </span>
      ) : null}
      {aguardando ? (
        <span className="text-ok" role="status">
          {resultado.recente
            ? "Já foi pedida há instantes. A verba chega em cerca de 1 minuto."
            : "Atualização pedida. A verba chega em cerca de 1 minuto."}
        </span>
      ) : null}
    </form>
  );
}

// Excluir um lançamento (só o admin vê). Pede confirmação antes: apaga tudo
// do lançamento e não dá para desfazer.
export function ExcluirLancamento({ id, nome }: { id: string; nome: string }) {
  const [resultado, acao, excluindo] = useActionState(excluirLancamento, {});
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="text-sm text-apagado hover:text-power-claro"
      >
        Excluir lançamento
      </button>
    );
  }

  return (
    <form action={acao} className="basis-full rounded-lg border border-power bg-cartao p-4 text-sm">
      <input type="hidden" name="id" value={id} />
      <p>
        Excluir <span className="font-semibold">{nome}</span>? Apaga o lançamento, os
        checkpoints e todo o histórico de métricas. Não dá para desfazer.
      </p>
      <p className="mt-1 text-apagado">
        Para só tirar do painel e guardar o histórico, use “Encerrar lançamento”.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={excluindo}
          className="rounded-lg bg-power px-3 py-1.5 font-semibold hover:brightness-125 disabled:opacity-60"
        >
          {excluindo ? "Excluindo…" : "Sim, excluir lançamento"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="text-apagado hover:text-texto"
        >
          Cancelar
        </button>
      </div>
      {resultado.erro ? (
        <p className="mt-2 text-power-claro" role="alert">
          {resultado.erro}
        </p>
      ) : null}
    </form>
  );
}

// Confere se o conector do Meta Ads enxerga a conta de anúncios do expert.
// Quem responde é a rotina do Claude, em cerca de um minuto: a tela se
// atualiza sozinha até a resposta chegar.
export function TesteMeta({
  lancamentoId,
  conta,
  pedidoEm,
  resposta,
}: {
  lancamentoId: string;
  // Conta já conhecida (a do lançamento ou a do último teste).
  conta: string | null;
  // Texto pronto de quando o teste foi pedido (null = nenhum pendente).
  pedidoEm: string | null;
  // Resposta do último teste concluído.
  resposta: { ok: boolean; detalhe: string; quando: string } | null;
}) {
  const [resultado, acao, pedindo] = useActionState(testarContaMeta, {});
  const router = useRouter();
  const aguardando = Boolean(pedidoEm) && !pedindo;

  useEffect(() => {
    if (!aguardando) return;
    const esperas = [30_000, 50_000, 75_000, 120_000, 180_000].map((ms) =>
      setTimeout(() => router.refresh(), ms),
    );
    return () => esperas.forEach(clearTimeout);
  }, [aguardando, pedidoEm, router]);

  return (
    <section className="mt-4 rounded-xl border border-borda bg-cartao p-5 text-sm">
      <h2 className="font-semibold">Conexão com o Meta Ads</h2>
      <p className="mt-1 text-apagado">
        Confere se a conta de anúncios do expert já pode ser lida. O número fica no
        Gerenciador de Anúncios, no seletor de contas.
      </p>
      <form action={acao} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="lancamento_id" value={lancamentoId} />
        <input
          name="conta"
          inputMode="numeric"
          defaultValue={conta ?? ""}
          placeholder="Número da conta de anúncios"
          aria-label="Número da conta de anúncios"
          className="w-full rounded-lg border border-borda bg-cartao-2 px-3 py-2 outline-none focus:border-power sm:max-w-xs"
        />
        <button
          type="submit"
          disabled={pedindo}
          className="shrink-0 rounded-lg border border-borda px-3 py-2 transition hover:border-power disabled:cursor-wait disabled:opacity-50"
        >
          {pedindo ? "Pedindo o teste…" : "Testar conexão com o Meta Ads"}
        </button>
      </form>
      {resultado.erro ? (
        <p className="mt-2 text-power-claro" role="alert">
          {resultado.erro}
        </p>
      ) : aguardando ? (
        <p className="mt-2 text-apagado" role="status">
          Teste pedido {pedidoEm}. A resposta chega em cerca de 1 minuto e aparece aqui
          sozinha.
        </p>
      ) : resposta ? (
        <p className="mt-2" role="status">
          <span className={resposta.ok ? "text-ok" : "text-power-claro"}>
            {resposta.ok ? "Conectado:" : "Sem conexão:"}
          </span>{" "}
          {resposta.detalhe}{" "}
          <span className="text-apagado">(testado {resposta.quando})</span>
        </p>
      ) : null}
    </section>
  );
}
