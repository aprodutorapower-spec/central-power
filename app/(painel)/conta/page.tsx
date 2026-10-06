import Link from "next/link";
import { trocarSenha } from "../actions";
import { BotaoEnviar } from "@/app/botao-enviar";

const AVISOS: Record<string, string> = {
  ok: "Senha alterada.",
  primeiro: "Você entrou. Crie uma senha para os próximos acessos.",
  curta: "A senha precisa ter pelo menos 8 caracteres.",
  diferente: "As duas senhas não são iguais.",
  erro: "Não foi possível alterar a senha. Tente de novo.",
};

export default async function ContaPage({ searchParams }: PageProps<"/conta">) {
  const { aviso } = await searchParams;
  const mensagem = typeof aviso === "string" ? AVISOS[aviso] : undefined;

  return (
    <>
      <Link href="/" className="text-sm text-apagado hover:text-texto">
        ← Voltar
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Minha conta</h1>

      <form
        action={trocarSenha}
        className="mt-6 max-w-sm rounded-xl border border-borda bg-cartao p-6"
      >
        <h2 className="font-semibold">Senha de acesso</h2>

        <label className="mt-4 block text-sm text-apagado" htmlFor="senha">
          Nova senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-borda bg-cartao-2 px-3 py-2 outline-none focus:border-power"
        />

        <label className="mt-4 block text-sm text-apagado" htmlFor="confirmacao">
          Repita a nova senha
        </label>
        <input
          id="confirmacao"
          name="confirmacao"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-borda bg-cartao-2 px-3 py-2 outline-none focus:border-power"
        />

        {mensagem ? (
          <p
            className={`mt-4 text-sm ${aviso === "ok" || aviso === "primeiro" ? "text-ok" : "text-power-claro"}`}
            role="status"
          >
            {mensagem}
          </p>
        ) : null}

        <BotaoEnviar className="mt-6 w-full rounded-lg bg-power px-4 py-2 font-semibold hover:brightness-125">
          Salvar nova senha
        </BotaoEnviar>
      </form>
    </>
  );
}
