import { formatarData } from "@/lib/datas";
import { formatarInteiro, formatarReal } from "@/lib/numeros";
import { STATUS_META, type StatusMeta, type Urgencia } from "@/lib/urgencia";

// Sem "use client": serve tanto para páginas do servidor quanto para formulários.

export function SeloMeta({ status }: { status: StatusMeta }) {
  const { rotulo, icone, cor } = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-semibold ${cor}`}>
      <span aria-hidden>{icone}</span>
      {rotulo}
    </span>
  );
}

// Barra de ingressos vendidos contra a meta, com um marcador de onde deveria
// estar hoje pelo ritmo esperado.
export function BarraIngressos({ urgencia }: { urgencia: Urgencia }) {
  const { vendidos, meta, esperado, status } = urgencia.ingressos;
  if (!meta) return null;

  const parte = (valor: number | null) =>
    `${Math.min(((valor ?? 0) / meta) * 100, 100)}%`;
  const cor =
    status === "abaixo" ? "bg-power-claro" : status === "acima" ? "bg-ok" : "bg-texto";

  return (
    <div
      className="relative mt-2 h-2 rounded-full bg-borda"
      role="img"
      aria-label={`${formatarInteiro(vendidos ?? 0)} de ${formatarInteiro(meta)} ingressos; esperado até hoje: ${formatarInteiro(esperado)}`}
    >
      <div className={`h-2 rounded-full ${cor}`} style={{ width: parte(vendidos) }} />
      <div
        className="absolute -top-1 h-4 w-0.5 bg-texto"
        style={{ left: parte(esperado) }}
        title={`Esperado até hoje: ${formatarInteiro(esperado)}`}
      />
    </div>
  );
}

export function PainelMetas({ urgencia }: { urgencia: Urgencia }) {
  const { ingressos, cpa, janela, diasAteD0 } = urgencia;

  return (
    <div className="grid gap-x-6 gap-y-4 sm:grid-cols-3">
      <div>
        <p className="flex items-center justify-between gap-2 text-xs text-apagado">
          Ingressos contra a meta
          <SeloMeta status={ingressos.status} />
        </p>
        <p className="mt-0.5 font-semibold">
          {formatarInteiro(ingressos.vendidos)}
          {ingressos.meta != null ? ` de ${formatarInteiro(ingressos.meta)}` : ""}
        </p>
        <BarraIngressos urgencia={urgencia} />
        {ingressos.meta != null ? (
          <p className="mt-1 text-xs text-apagado">
            Esperado até hoje: {formatarInteiro(ingressos.esperado)}
          </p>
        ) : null}
      </div>
      <div>
        <p className="flex items-center justify-between gap-2 text-xs text-apagado">
          CPA contra a meta
          <SeloMeta status={cpa.status} />
        </p>
        <p className="mt-0.5 font-semibold">{formatarReal(cpa.atual)}</p>
        {cpa.meta != null ? (
          <p className="mt-1 text-xs text-apagado">Meta: até {formatarReal(cpa.meta)}</p>
        ) : null}
      </div>
      <div>
        <p className="text-xs text-apagado">Venda de ingressos</p>
        <p className="mt-0.5 font-semibold">
          {formatarData(janela.inicio)} a {formatarData(janela.fim)}
        </p>
        <p className="mt-1 text-xs text-apagado">
          {diasAteD0 > 0
            ? `Faltam ${diasAteD0} ${diasAteD0 === 1 ? "dia" : "dias"} para o D0`
            : diasAteD0 === 0
              ? "O D0 é hoje"
              : `D+${-diasAteD0}`}
        </p>
      </div>
    </div>
  );
}
