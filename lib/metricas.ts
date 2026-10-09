import { dividir } from "./numeros";
import type { Tipo } from "./marcos";

export type Status = "verde" | "amarelo" | "vermelho";

export const STATUS: Record<Status, { rotulo: string; ponto: string; texto: string }> = {
  verde: { rotulo: "No trilho", ponto: "bg-ok", texto: "text-ok" },
  amarelo: { rotulo: "Atenção", ponto: "bg-atencao", texto: "text-atencao" },
  vermelho: { rotulo: "Em risco", ponto: "bg-power-claro", texto: "text-power-claro" },
};

export type Foto = {
  id: string;
  lancamento_id: string;
  data: string;
  criado_em: string;
  preenchido_por_nome: string | null;
  fonte: string;
  verba_investida: number | null;
  ingressos_vendidos: number | null;
  receita_ingressos: number | null;
  grupo_whatsapp: number | null;
  compras_trafego: number | null;
  comp_evento: number | null;
  comp_aula1: number | null;
  comp_aula2: number | null;
  comp_aula3: number | null;
  comp_aula4: number | null;
  comp_aula5: number | null;
  comp_pitch: number | null;
  vendas_produto: number | null;
  faturamento_produto: number | null;
};

// CPA = verba ÷ ingressos; ticket médio = receita de ingressos ÷ ingressos;
// comparecimento = pessoas no grupo de WhatsApp ÷ ingressos.
// CAC = verba ÷ vendas que vieram do tráfego (Ricardo, 09/10/2026); as vendas
// orgânicas são os ingressos que sobram depois de tirar as do tráfego.
export function calcular(
  foto: Pick<
    Foto,
    "verba_investida" | "ingressos_vendidos" | "receita_ingressos" | "grupo_whatsapp"
  > &
    Partial<Pick<Foto, "compras_trafego">>,
) {
  const doTrafego = foto.compras_trafego ?? null;
  const organicas =
    doTrafego != null && foto.ingressos_vendidos != null
      ? Math.max(foto.ingressos_vendidos - doTrafego, 0)
      : null;
  return {
    cpa: dividir(foto.verba_investida, foto.ingressos_vendidos),
    ticketMedio: dividir(foto.receita_ingressos, foto.ingressos_vendidos),
    comparecimento: dividir(foto.grupo_whatsapp, foto.ingressos_vendidos),
    cac: dividir(foto.verba_investida, doTrafego),
    doTrafego,
    organicas,
    // Fatia de cada origem no total de ingressos.
    parteDoTrafego: organicas == null ? null : dividir(doTrafego, foto.ingressos_vendidos),
    parteOrganica: dividir(organicas, foto.ingressos_vendidos),
  };
}

export function haQuanto(dias: number) {
  if (dias <= 0) return "hoje";
  return dias === 1 ? "há 1 dia" : `há ${dias} dias`;
}

// Comparecimento no evento: quantas pessoas estiveram presentes. O LP tem um
// evento só; o LPS tem as cinco aulas e o pitch. (O grupo de WhatsApp é outro
// número, medido antes do evento.)
export const CAMPOS_COMPARECIMENTO = [
  "comp_evento",
  "comp_aula1",
  "comp_aula2",
  "comp_aula3",
  "comp_aula4",
  "comp_aula5",
  "comp_pitch",
] as const;
export type CampoComparecimento = (typeof CAMPOS_COMPARECIMENTO)[number];

export const COMPARECIMENTO: Record<Tipo, { campo: CampoComparecimento; rotulo: string }[]> = {
  LP: [{ campo: "comp_evento", rotulo: "No evento" }],
  LPS: [
    { campo: "comp_aula1", rotulo: "Aula 1" },
    { campo: "comp_aula2", rotulo: "Aula 2" },
    { campo: "comp_aula3", rotulo: "Aula 3" },
    { campo: "comp_aula4", rotulo: "Aula 4" },
    { campo: "comp_aula5", rotulo: "Aula 5" },
    { campo: "comp_pitch", rotulo: "Pitch" },
  ],
};

// A foto é o retrato completo do momento: o que uma atualização não informa
// segue com o valor da foto anterior. Quem grava sobrescreve só o que é seu.
export function herdarDaUltima(ultima: Partial<Foto> | null | undefined) {
  return {
    verba_investida: ultima?.verba_investida ?? null,
    ingressos_vendidos: ultima?.ingressos_vendidos ?? null,
    receita_ingressos: ultima?.receita_ingressos ?? null,
    grupo_whatsapp: ultima?.grupo_whatsapp ?? null,
    compras_trafego: ultima?.compras_trafego ?? null,
    ...(Object.fromEntries(
      CAMPOS_COMPARECIMENTO.map((campo) => [campo, ultima?.[campo] ?? null]),
    ) as Record<CampoComparecimento, number | null>),
  };
}
