import { confirmarAcesso } from "./actions";
import { BotaoEnviar } from "@/app/botao-enviar";

// A entrada só acontece no clique do botão: aplicativos de mensagem abrem o
// link sozinhos para montar a prévia, e isso gastaria o link de uso único.
export default async function ConfirmarPage({
  searchParams,
}: PageProps<"/auth/confirmar">) {
  const { token_hash } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form
        action={confirmarAcesso}
        className="w-full max-w-sm rounded-xl border border-borda bg-cartao p-8"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-power.png" alt="Power" className="h-8 w-auto" />
        <h1 className="mt-6 text-xl font-semibold">Controle de Lançamentos</h1>
        <p className="mt-1 text-sm text-apagado">
          Seu acesso foi liberado. Clique para entrar e criar sua senha.
        </p>
        <input
          type="hidden"
          name="token_hash"
          value={typeof token_hash === "string" ? token_hash : ""}
        />
        <BotaoEnviar className="mt-6 w-full rounded-lg bg-power px-4 py-2 font-semibold hover:brightness-125">
          Entrar
        </BotaoEnviar>
      </form>
    </main>
  );
}
