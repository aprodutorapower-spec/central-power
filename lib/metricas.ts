import { dividir } from "./numeros";

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
export function calcular(
  foto: Pick<
    Foto,
    "verba_investida" | "ingressos_vendidos" | "receita_ingressos" | "grupo_whatsapp"
  >,
) {
  return {
    cpa: dividir(foto.verba_investida, foto.ingressos_vendidos),
    ticketMedio: dividir(foto.receita_ingressos, foto.ingressos_vendidos),
    comparecimento: dividir(foto.grupo_whatsapp, foto.ingressos_vendidos),
  };
}

export function haQuanto(dias: number) {
  if (dias <= 0) return "hoje";
  return dias === 1 ? "há 1 dia" : `há ${dias} dias`;
}
