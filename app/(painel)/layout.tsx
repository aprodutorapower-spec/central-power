import { redirect } from "next/navigation";
import { criarClienteServidor, supabaseConfigurado } from "@/lib/supabase/server";
import { AvisoConfiguracao } from "../aviso-configuracao";
import { sair } from "../login/actions";

export default async function PainelLayout({ children }: LayoutProps<"/">) {
  if (!supabaseConfigurado()) return <AvisoConfiguracao />;

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome, papel, ativo")
    .eq("id", user.id)
    .maybeSingle();

  const liberado = Boolean(perfil?.ativo);

  return (
    <>
      <header className="border-b border-borda bg-cartao">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-power.png" alt="Power" className="h-6 w-auto" />
            <span className="hidden text-sm text-apagado sm:inline">
              Controle de Lançamentos
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-apagado">
              {perfil?.nome ?? user.email}
              {perfil?.papel === "admin" ? " · Admin" : ""}
            </span>
            <form action={sair}>
              <button
                type="submit"
                className="rounded-lg border border-borda px-3 py-1.5 hover:border-power-claro"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {liberado ? (
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
