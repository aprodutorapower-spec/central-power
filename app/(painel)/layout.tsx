import Link from "next/link";
import { redirect } from "next/navigation";
import { obterSessao } from "@/lib/sessao";
import { supabaseConfigurado } from "@/lib/supabase/server";
import { AvisoConfiguracao } from "../aviso-configuracao";
import { sair } from "../login/actions";
import { BotaoEnviar } from "@/app/botao-enviar";

export default async function PainelLayout({ children }: LayoutProps<"/">) {
  if (!supabaseConfigurado()) return <AvisoConfiguracao />;

  const { logado, perfil } = await obterSessao();
  if (!logado) redirect("/login");

  const admin = perfil?.papel === "admin";
  const menu = admin
    ? [
        { href: "/", rotulo: "Visão geral" },
        { href: "/experts", rotulo: "Experts" },
        { href: "/estrategistas", rotulo: "Estrategistas" },
        { href: "/modelos", rotulo: "Modelos de checkpoint" },
      ]
    : [{ href: "/experts", rotulo: "Meus experts" }];

  return (
    <>
      <header className="border-b border-borda bg-cartao">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-power.png" alt="Power" className="h-6 w-auto" />
            <span className="hidden text-sm text-apagado md:inline">
              Controle de Lançamentos
            </span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/conta" className="text-apagado hover:text-texto">
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
            <nav className="flex w-full flex-wrap gap-x-5 gap-y-2 text-sm">
              {menu.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-power-claro">
                  {item.rotulo}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {perfil ? (
          children
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
    </>
  );
}
