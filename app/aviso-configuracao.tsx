export function AvisoConfiguracao() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-borda bg-cartao p-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-power.png" alt="Power" className="mx-auto h-8 w-auto" />
        <h1 className="mt-6 text-xl font-semibold">Falta configurar</h1>
        <p className="mt-2 text-sm text-apagado">
          O sistema ainda não recebeu o endereço e a chave do banco de dados.
          Cadastre as duas variáveis de ambiente na Vercel e publique de novo.
        </p>
      </div>
    </main>
  );
}
