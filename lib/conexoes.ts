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

function quando(instante: string) {
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

function situacao(
  nome: string,
  conferidoEm: string | null,
  erro: string | null,
  agora: Date,
) {
  if (erro) return `${nome} com erro: ${erro}`;
  if (!conferidoEm) return `${nome}: aguardando a primeira atualização automática`;
  const horas = (agora.getTime() - new Date(conferidoEm).getTime()) / 3_600_000;
  return horas > HORAS_SEM_ROTINA ? `${nome} sem atualizar desde ${quando(conferidoEm)}` : null;
}

// `hoje` é o dia de calendário ("AAAA-MM-DD"); `agora`, o instante da consulta.
export function avisosDeConexao(l: Entrada, hoje: string, agora: Date): string[] {
  const avisos: (string | null)[] = [];

  if (!l.berry_produto_id) {
    avisos.push("Berry não conectada: ingressos e receita não atualizam sozinhos");
  } else {
    avisos.push(situacao("Berry", l.berry_conferido_em, l.berry_erro, agora));
  }

  if (!l.sem_trafego) {
    if (!l.meta_conta_id || !l.meta_filtro?.trim()) {
      avisos.push("Meta Ads não conectado: a verba não atualiza sozinha");
    } else if ((l.meta_desde ?? janelaDeVendas(l).inicio) <= hoje) {
      // Antes do início do período a rotina ainda não consulta: sem aviso.
      avisos.push(situacao("Meta Ads", l.meta_conferido_em, l.meta_erro, agora));
    }
  }

  return avisos.filter((aviso) => aviso != null);
}
