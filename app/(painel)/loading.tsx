// Aparece enquanto a página nova está sendo montada, para o clique não
// parecer que travou.
export default function Carregando() {
  return (
    <div role="status" aria-label="Carregando" className="animate-pulse">
      <div className="h-7 w-56 rounded bg-cartao" />
      <div className="mt-6 h-28 rounded-xl bg-cartao" />
      <div className="mt-3 h-40 rounded-xl bg-cartao" />
      <div className="mt-3 h-40 rounded-xl bg-cartao" />
    </div>
  );
}
