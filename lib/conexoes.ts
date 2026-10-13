// Avisos de conexão de um lançamento ativo: o que deveria atualizar sozinho
// (Berry e Meta Ads) e não está atualizando. Com tudo em dia, a lista vem
// vazia e a tela não mostra nada.
//
// Imports com ".ts" pelo mesmo motivo de urgencia.ts: os testes rodam no Node.
import { ehGratuito } from "./rotulos.ts";
import { janelaDeVendas } from "./urgencia.ts";
import type { Lancamento } from "./marcos";

// As rotinas rodam às 9h, 12h e 18h de Brasília: o maior intervalo normal é
// de 15 horas (das 18h às 9h). Passou disso, uma rodada foi perdida.
export const HORAS_SEM_ROTINA = 16;

export type AvisoConexao = {
  fonte: "berry" | "meta";
  tipo: "desconectado" | "erro" | "aguardando" | "parado" | "verba_parada";
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
> &
  Partial<Pick<Lancamento, "tipo">>;

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

  // Lançamento gratuito não vende ingresso: não há o que ler na Berry.
  if (!ehGratuito(l.tipo)) {
    if (!l.berry_produto_id) {
      avisos.push({
        fonte: "berry",
        tipo: "desconectado",
        texto: "Berry não conectada: ingressos e receita não atualizam sozinhos",
      });
    } else {
      avisos.push(situacao("berry", "Berry", l.berry_conferido_em, l.berry_erro, agora));
    }
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

// Verba parada: o Meta Ads está sendo lido normalmente, a captação (venda de
// ingressos ou de leads) está aberta e mesmo assim o investido não sobe. É o
// sinal de anúncio parado (cartão recusado, conta bloqueada, campanha pausada).
// Depois do fim da captação a verba parar é o esperado, então não avisa.
export const HORAS_VERBA_PARADA = 8;

export function verbaParada(
  l: Entrada,
  // Fotos de métricas do lançamento, da mais antiga para a mais nova.
  fotos: { criado_em: string; verba_investida: number | null }[],
  hoje: string,
): AvisoConexao | null {
  if (l.sem_trafego || !l.meta_conta_id || !l.meta_filtro?.trim()) return null;
  // Leitura do Meta com problema já é avisada como conexão.
  if (l.meta_erro || !l.meta_conferido_em) return null;
  const janela = janelaDeVendas(l);
  if (hoje < (l.meta_desde ?? janela.inicio) || hoje > janela.fim) return null;

  const ultima = fotos.at(-1);
  if (!ultima || !ultima.verba_investida) return null;
  // Desde quando a verba tem o valor de agora.
  let desde = ultima.criado_em;
  for (let i = fotos.length - 1; i >= 0; i -= 1) {
    if (Number(fotos[i].verba_investida) !== Number(ultima.verba_investida)) break;
    desde = fotos[i].criado_em;
  }
  // Conta só o tempo confirmado por leitura do Meta: sem leitura nova, não dá
  // para dizer que a verba parou.
  const horas =
    (new Date(l.meta_conferido_em).getTime() - new Date(desde).getTime()) / 3_600_000;
  if (horas < HORAS_VERBA_PARADA) return null;
  return {
    fonte: "meta",
    tipo: "verba_parada",
    texto: `Verba parada desde ${quando(desde)}: os anúncios podem ter parado`,
  };
}
