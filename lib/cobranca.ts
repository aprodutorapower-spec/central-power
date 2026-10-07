// Texto do botão "Copiar cobrança": curto, cordial e direto, com os números
// do problema, pronto para colar no WhatsApp. Só gera texto; não envia nada.
//
// Imports com ".ts" pelo mesmo motivo de urgencia.ts: os testes rodam no Node.
import { formatarData } from "./datas.ts";
import { formatarInteiro, formatarReal } from "./numeros.ts";
import type { Urgencia } from "./urgencia.ts";

// Quantos checkpoints atrasados são citados pelo nome; o resto vira "mais N".
export const MAXIMO_CHECKPOINTS_CITADOS = 3;

type Entrada = {
  // Nome de quem vai receber (null = expert sem responsável).
  estrategista: string | null;
  expert: string;
  lancamento: { nome: string; d0: string };
  urgencia: Urgencia;
  // Checkpoints atrasados, do mais antigo para o mais recente.
  atrasados: { titulo: string; dias: number }[];
};

const pct = (valor: number) => `${Math.round(Math.abs(valor) * 100)}%`;
const dias = (n: number) => (n === 1 ? "1 dia" : `${n} dias`);

// Devolve null quando não há nada a cobrar.
export function textoCobranca({
  estrategista,
  expert,
  lancamento,
  urgencia: u,
  atrasados,
}: Entrada) {
  const pontos: string[] = [];

  if (u.ingressos.status === "abaixo") {
    pontos.push(
      `Ingressos: ${formatarInteiro(u.ingressos.vendidos)} vendidos, ${pct(u.ingressos.desvio!)} abaixo do ritmo (esperado até hoje: ${formatarInteiro(u.ingressos.esperado)}; meta: ${formatarInteiro(u.ingressos.meta)}).`,
    );
  }
  if (u.cpa.status === "abaixo") {
    pontos.push(
      u.cpa.origemMeta === "mercado"
        ? `CPA: ${formatarReal(u.cpa.atual)}, ${pct(u.cpa.desvio!)} acima do teto de ${formatarReal(u.cpa.meta)} (o dobro do ticket do ingresso).`
        : `CPA: ${formatarReal(u.cpa.atual)}, ${pct(u.cpa.desvio!)} acima da meta de ${formatarReal(u.cpa.meta)}.`,
    );
  }
  if (u.cpa.acimaDoTeto) {
    pontos.push(
      `CPA: ${formatarReal(u.cpa.atual)}, acima do teto de ${formatarReal(u.cpa.teto)} (o dobro do ticket do ingresso).`,
    );
  }
  if (u.grupo.status === "abaixo") {
    pontos.push(
      `Grupo de WhatsApp: ${formatarInteiro(u.grupo.pessoas)} pessoas, ${pct(u.grupo.proporcao!)} dos ingressos vendidos (o mínimo é ${pct(u.grupo.minimo)}).`,
    );
  }
  if (u.faixa === "sem_dados") {
    pontos.push(
      `As vendas começaram em ${formatarData(u.janela.inicio)} e ainda não há métricas registradas.`,
    );
  }
  const temProblema = pontos.length > 0 || atrasados.length > 0;

  for (const atrasado of atrasados.slice(0, MAXIMO_CHECKPOINTS_CITADOS)) {
    pontos.push(`Checkpoint atrasado: “${atrasado.titulo}” (há ${dias(atrasado.dias)}).`);
  }
  const resto = atrasados.length - MAXIMO_CHECKPOINTS_CITADOS;
  if (resto > 0) {
    pontos.push(
      resto === 1 ? "Mais 1 checkpoint atrasado." : `Mais ${resto} checkpoints atrasados.`,
    );
  }

  if (u.diasSemAtualizar == null) {
    pontos.push("O lançamento ainda não foi atualizado no painel.");
  } else if (u.parado) {
    pontos.push(`Sem atualização no painel há ${dias(u.diasSemAtualizar)}.`);
  }

  if (!pontos.length) return null;

  const quando =
    u.diasAteD0 > 0
      ? `faltam ${dias(u.diasAteD0)}`
      : u.diasAteD0 === 0
        ? "é hoje"
        : `foi há ${dias(-u.diasAteD0)}`;
  const saudacao = estrategista ? `Oi, ${estrategista.split(" ")[0]}!` : "Oi!";

  return [
    `${saudacao} Tudo bem?`,
    `Sobre o lançamento ${lancamento.nome} (${expert}), com D0 em ${formatarData(lancamento.d0)} (${quando}):`,
    ...pontos.map((ponto) => `• ${ponto}`),
    temProblema
      ? "Consegue me dizer o que está travando e qual é o plano para recuperar? Obrigado!"
      : "Consegue atualizar os números hoje? Obrigado!",
  ].join("\n");
}
