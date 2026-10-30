import Link from "next/link";
import { redirect } from "next/navigation";
import { obterSessao } from "@/lib/sessao";
import { supabaseConfigurado } from "@/lib/supabase/server";
import { AvisoConfiguracao } from "../aviso-configuracao";
import { sair } from "../login/actions";
import { BotaoEnviar } from "@/app/botao-enviar";
import { AtualizarAoVoltar, ConviteInstalar, Menu, MenuInferior } from "./interacoes";

export default async function PainelLayout({ children }: LayoutProps<"/">) {
  if (!supabaseConfigurado()) return <AvisoConfiguracao />;

  const { logado, perfil } = await obterSessao();
  if (!logado) redirect("/login");

  const admin = perfil?.papel === "admin";
  const menu = admin
    ? [
        { href: "/", rotulo: "Visão geral", icone: "inicio" as const },
        { href: "/experts", rotulo: "Experts", icone: "experts" as const },
        { href: "/estrategistas", rotulo: "Estrategistas", icone: "pessoas" as const },
        { href: "/modelos", rotulo: "Modelos de checkpoint", curto: "Modelos", icone: "modelos" as const },
      ]
    : [
        { href: "/", rotulo: "Meus lançamentos", curto: "Lançamentos", icone: "inicio" as const },
        { href: "/experts", rotulo: "Meus experts", curto: "Experts", icone: "experts" as const },
      ];

  return (
    <>
      <AtualizarAoVoltar />
      <header className="border-b border-borda bg-cartao pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6 md:py-4">
          <Link href="/" className="flex shrink-0 items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-power.png" alt="Power" className="h-6 w-auto" />
            <span className="hidden text-sm text-apagado md:inline">
              Controle de Lançamentos
            </span>
          </Link>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-4 text-sm">
            <Link href="/conta" className="min-w-0 truncate text-apagado hover:text-texto">
              {perfil?.nome ?? "Minha conta"}
              {admin ? " · Admin" : ""}
            </Link>
            <form action={sair}>
              <BotaoEnviar className="rounded-lg border border-borda px-3 py-1.5 hover:border-power">
                Sair
              </BotaoEnviar>
            </form>
          </div>
          {perfil ? (
            <Menu itens={menu} />
          ) : null}
        </div>
      </header>
      {/* No celular o fim da página sobra acima da barra de baixo. */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 md:py-8">
        {perfil ? (
          <>
            <ConviteInstalar />
            {children}
          </>
        ) : (
          <div className="rounded-xl border border-borda bg-cartao p-8">
            <h1 className="text-xl font-semibold">Acesso ainda não liberado</h1>
            <p className="mt-2 text-sm text-apagado">
              Seu login funciona, mas seu usuário ainda não foi liberado no
              sistema. Fale com o Ricardo.
            </p>
          </div>
        )}
      </main>
      {perfil ? <MenuInferior itens={menu} /> : null}
    </>
  );
}
