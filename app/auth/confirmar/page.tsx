import { criarSenha } from "./actions";
import { BotaoEnviar } from "@/app/botao-enviar";

const CAMPO =
  "mt-1 w-full rounded-lg border border-borda bg-cartao-2 px-3 py-2 outline-none focus:border-power";
const AVISOS: Record<string, string> = {
  curta: "A senha precisa ter pelo menos 8 caracteres.",
  diferente: "As duas senhas não são iguais.",
};

// O link só é gasto quando a senha é salva: aplicativos de mensagem abrem o
// link sozinhos para montar a prévia, e a pessoa pode abrir mais de uma vez.
export default async function ConfirmarPage({
  searchParams,
}: PageProps<"/auth/confirmar">) {
  const { token_hash, aviso } = await searchParams;
  const mensagem = typeof aviso === "string" ? AVISOS[aviso] : undefined;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form
        action={criarSenha}
        className="w-full max-w-sm rounded-xl border border-borda bg-cartao p-8"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-power.png" alt="Power" className="h-8 w-auto" />
        <h1 className="mt-6 text-xl font-semibold">Crie sua senha</h1>
        <p className="mt-1 text-sm text-apagado">
          Seu acesso ao Controle de Lançamentos foi liberado. Crie uma senha;
          em seguida você entra com seu e-mail e essa senha.
        </p>
        <input
          type="hidden"
          name="token_hash"
          value={typeof token_hash === "string" ? token_hash : ""}
        />

        <label className="mt-6 block text-sm text-apagado" htmlFor="senha">
          Nova senha (pelo menos 8 caracteres)
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={CAMPO}
        />

        <label className="mt-4 block text-sm text-apagado" htmlFor="confirmacao">
          Repita a senha
        </label>
        <input
          id="confirmacao"
          name="confirmacao"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={CAMPO}
        />

        {mensagem ? (
          <p className="mt-4 text-sm text-power-claro" role="alert">
            {mensagem}
          </p>
        ) : null}

        <BotaoEnviar className="mt-6 w-full rounded-lg bg-power px-4 py-2 font-semibold hover:brightness-125">
          Criar senha
        </BotaoEnviar>
      </form>
    </main>
  );
}
