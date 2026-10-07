import { formatarData } from "@/lib/datas";
import { contagem, type ItemLinha } from "@/lib/linha-do-tempo";
import { CartaoCheckpoint } from "./[id]/cartao-checkpoint";

type Props = {
  itens: ItemLinha[];
  proximo: ItemLinha | undefined;
  hoje: string;
  quem: string;
};

// Marcos e checkpoints em ordem de data. Usada na página do lançamento e no
// painel lateral da visão do estrategista.
export function LinhaDoTempo({ itens, proximo, hoje, quem }: Props) {
  return (
    <ol className="border-l border-borda">
      {itens.map((item) =>
        item.tipo === "checkpoint" ? (
          <CartaoCheckpoint
            key={item.chave}
            checkpoint={item.checkpoint}
            hoje={hoje}
            proximo={item === proximo}
            quem={quem}
          />
        ) : (
          <li key={item.chave} className="relative pb-4 pl-6">
            <span className="absolute -left-[5px] top-3.5 h-2.5 w-2.5 rounded-full bg-borda" />
            <div
              className={`flex flex-wrap items-baseline justify-between gap-x-3 rounded-lg px-4 py-2 text-sm ${
                item === proximo ? "border border-power" : ""
              } ${item.dias < 0 ? "text-apagado" : ""}`}
            >
              <span>
                <span className="font-semibold">{item.sigla}</span> · {item.titulo}
              </span>
              <span>
                {formatarData(item.data)}
                <span className="ml-2 text-apagado">{contagem(item.dias)}</span>
              </span>
            </div>
          </li>
        ),
      )}
    </ol>
  );
}
