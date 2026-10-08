// Avisos de conexão de um lançamento ativo: o que deveria atualizar sozinho
// (Berry e Meta Ads) e não está atualizando. Com tudo em dia, a lista vem
// vazia e a tela não mostra nada.
//
// Imports com ".ts" pelo mesmo motivo de urgencia.ts: os testes rodam no Node.
import { janelaDeVendas } from "./urgencia.ts";
import type { Lancamento } from "./marcos";

// As rotinas rodam às 9h, 12h e 18h de Brasília: o maior intervalo normal é
// de 15 horas (das 18h às 9h). Passou disso, uma rodada foi perdida.
export const HORAS_SEM_ROTINA = 16;

export type AvisoConexao = {
  fonte: "berry" | "meta";
  tipo: "desconectado" | "erro" | "aguardando" | "parado";
  texto: string;
};

type Entrada = Pick<
  Lancamento,
  | "sem_trafego"
  | "berry_produto_id"
  | "berry_conferido_em"
  | "berry_erro"
  | "meta_conta_id"
  | "meta_filtro"
  | "meta_desde"
  | "meta_conferido_em"
  | "meta_erro"
  | "inicio_vendas"
  | "fim_vendas"
  | "dv0"
  | "de0"
  | "d0"
>;

// "08/10 às 14h28", no horário de Brasília.
export function quando(instante: string) {
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(instante));
  const parte = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${parte("day")}/${parte("month")} às ${parte("hour")}h${parte("minute")}`;
}

export function horasDesde(instante: string, agora: Date) {
  return (agora.getTime() - new Date(instante).getTime()) / 3_600_000;
}

function situacao(
  fonte: AvisoConexao["fonte"],
  nome: string,
  conferidoEm: string | null,
  erro: string | null,
  agora: Date,
): AvisoConexao | null {
  if (erro) return { fonte, tipo: "erro", texto: `${nome} com erro: ${erro}` };
  if (!conferidoEm) {
    return {
      fonte,
      tipo: "aguardando",
      texto: `${nome}: aguardando a primeira atualização automática`,
    };
  }
  return horasDesde(conferidoEm, agora) > HORAS_SEM_ROTINA
    ? { fonte, tipo: "parado", texto: `${nome} sem atualizar desde ${quando(conferidoEm)}` }
    : null;
}

// `hoje` é o dia de calendário ("AAAA-MM-DD"); `agora`, o instante da consulta.
export function avisosDeConexao(l: Entrada, hoje: string, agora: Date): AvisoConexao[] {
  const avisos: (AvisoConexao | null)[] = [];

  if (!l.berry_produto_id) {
    avisos.push({
      fonte: "berry",
      tipo: "desconectado",
      texto: "Berry não conectada: ingressos e receita não atualizam sozinhos",
    });
  } else {
    avisos.push(situacao("berry", "Berry", l.berry_conferido_em, l.berry_erro, agora));
  }

  if (!l.sem_trafego) {
    if (!l.meta_conta_id || !l.meta_filtro?.trim()) {
      avisos.push({
        fonte: "meta",
        tipo: "desconectado",
        texto: "Meta Ads não conectado: a verba não atualiza sozinha",
      });
    } else if ((l.meta_desde ?? janelaDeVendas(l).inicio) <= hoje) {
      // Antes do início do período a rotina ainda não consulta: sem aviso.
      avisos.push(situacao("meta", "Meta Ads", l.meta_conferido_em, l.meta_erro, agora));
    }
  }

  return avisos.filter((aviso) => aviso != null);
}
