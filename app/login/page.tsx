import { supabaseConfigurado } from "@/lib/supabase/server";
import { AvisoConfiguracao } from "../aviso-configuracao";
import { entrar } from "./actions";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (!supabaseConfigurado()) return <AvisoConfiguracao />;

  const { erro } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form
        action={entrar}
        className="w-full max-w-sm rounded-xl border border-borda bg-cartao p-8"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-power.png" alt="Power" className="h-8 w-auto" />
        <h1 className="mt-6 text-xl font-semibold">Controle de Lançamentos</h1>
        <p className="mt-1 text-sm text-apagado">Entre com seu e-mail e senha.</p>

        <label className="mt-6 block text-sm text-apagado" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-lg border border-borda bg-cartao-2 px-3 py-2 outline-none focus:border-power-claro"
        />

        <label className="mt-4 block text-sm text-apagado" htmlFor="senha">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-borda bg-cartao-2 px-3 py-2 outline-none focus:border-power-claro"
        />

        {erro ? (
          <p className="mt-4 text-sm text-power-claro" role="alert">
            {erro === "link"
              ? "Esse link de acesso já foi usado ou venceu. Peça um novo ao Ricardo."
              : "E-mail ou senha incorretos."}
          </p>
        ) : null}

        <button
          type="submit"
          className="mt-6 w-full rounded-lg bg-power px-4 py-2 font-semibold hover:bg-power-claro"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
