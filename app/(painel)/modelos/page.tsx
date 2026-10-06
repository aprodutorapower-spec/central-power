import { redirect } from "next/navigation";
import { TIPOS, type Tipo } from "@/lib/marcos";
import { obterSessao } from "@/lib/sessao";
import { removerModelo, salvarModelo } from "./actions";
import { BotaoEnviar } from "@/app/botao-enviar";

type Modelo = {
  id: string;
  tipo: Tipo;
  titulo: string;
  dias_do_d0: number;
  descricao: string;
};

const CAMPO =
  "mt-1 w-full rounded-lg border border-borda bg-cartao-2 px-3 py-2 text-sm text-texto outline-none focus:border-power";

function prazo(dias: number) {
  if (dias === 0) return "D0";
  return dias > 0 ? `D0+${dias}` : `D0${dias}`;
}

function FormModelo({ modelo, tipo }: { modelo?: Modelo; tipo: Tipo }) {
  return (
    <form action={salvarModelo} className="grid gap-3 sm:grid-cols-[1fr_7rem]">
      <input type="hidden" name="id" value={modelo?.id ?? ""} />
      <input type="hidden" name="tipo" value={tipo} />
      <label className="text-xs text-apagado">
        Título
        <input
          name="titulo"
          required
          defaultValue={modelo?.titulo ?? ""}
          className={CAMPO}
        />
      </label>
      <label className="text-xs text-apagado">
        Dias do D0
        <input
          name="dias_do_d0"
          type="number"
          required
          defaultValue={modelo?.dias_do_d0 ?? 0}
          className={CAMPO}
        />
      </label>
      <label className="text-xs text-apagado sm:col-span-2">
        O que precisa estar pronto
        <textarea
          name="descricao"
          rows={2}
          defaultValue={modelo?.descricao ?? ""}
          className={CAMPO}
        />
      </label>
      <div className="sm:col-span-2">
        <BotaoEnviar className="rounded-lg border border-borda px-3 py-1.5 text-sm hover:border-power">
          {modelo ? "Salvar" : "Adicionar checkpoint"}
        </BotaoEnviar>
      </div>
    </form>
  );
}

export default async function ModelosPage() {
  const { supabase, perfil } = await obterSessao();
  if (perfil?.papel !== "admin") redirect("/experts");

  const { data } = await supabase
    .from("checkpoint_modelos")
    .select("id, tipo, titulo, dias_do_d0, descricao")
    .order("dias_do_d0");
  const modelos = (data ?? []) as Modelo[];

  return (
    <>
      <h1 className="text-2xl font-semibold">Modelos de checkpoint</h1>
      <p className="mt-2 max-w-2xl text-sm text-apagado">
        Cada lançamento novo nasce com estes checkpoints, com a data contada a
        partir do D0 (negativo é antes, positivo é depois). Mudanças aqui valem
        só para os lançamentos criados depois.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {(Object.keys(TIPOS) as Tipo[]).map((tipo) => (
          <section key={tipo}>
            <h2 className="font-semibold">{TIPOS[tipo]}</h2>
            <ul className="mt-3 grid gap-3">
              {modelos
                .filter((modelo) => modelo.tipo === tipo)
                .map((modelo) => (
                  <li
                    key={modelo.id}
                    className="rounded-xl border border-borda bg-cartao p-4"
                  >
                    <details>
                      <summary className="flex cursor-pointer list-none items-baseline justify-between gap-3">
                        <span className="font-semibold">{modelo.titulo}</span>
                        <span className="shrink-0 text-sm text-apagado">
                          {prazo(modelo.dias_do_d0)} · editar
                        </span>
                      </summary>
                      <div className="mt-4">
                        <FormModelo modelo={modelo} tipo={tipo} />
                        <form action={removerModelo} className="mt-3">
                          <input type="hidden" name="id" value={modelo.id} />
                          <BotaoEnviar className="text-xs text-apagado hover:text-power-claro">
                            Remover este checkpoint do modelo
                          </BotaoEnviar>
                        </form>
                      </div>
                    </details>
                  </li>
                ))}
              <li className="rounded-xl border border-dashed border-borda p-4">
                <details>
                  <summary className="cursor-pointer list-none text-sm text-apagado">
                    + Novo checkpoint no modelo {tipo}
                  </summary>
                  <div className="mt-4">
                    <FormModelo tipo={tipo} />
                  </div>
                </details>
              </li>
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
