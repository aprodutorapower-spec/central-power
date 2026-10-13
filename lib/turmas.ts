// Turmas do lançamento semanal (LPS). Toda semana roda uma turma nova do mesmo
// workshop: em vez de cadastrar tudo de novo, a próxima turma nasce como cópia
// da atual, uma semana depois. Cada turma é um lançamento, com os seus números.
//
// Import com ".ts" pelo mesmo motivo de urgencia.ts: os testes rodam no Node.
import { somarDias } from "./datas.ts";

export const DIAS_ENTRE_TURMAS = 7;

const SUFIXO = / · turma \d{2}\/\d{2}$/;

// "Workshop Vistoriador" ou "Workshop Vistoriador · turma 12/10" => "Workshop Vistoriador · turma 19/10"
export function nomeDaTurma(nome: string, d0: string) {
  const [, mes, dia] = d0.split("-");
  return `${nome.replace(SUFIXO, "").trim()} · turma ${dia}/${mes}`;
}

// O gestor de tráfego etiqueta as campanhas com as datas da turma
// ("VENDAS, 12/10-18/10"). Anda todas as datas dd/mm do filtro uma semana.
export function deslocarDatasDoFiltro(filtro: string | null, d0: string, dias = DIAS_ENTRE_TURMAS) {
  if (!filtro) return filtro;
  const ano = Number(d0.slice(0, 4));
  const mesDoD0 = Number(d0.slice(5, 7));
  return filtro.replace(/\b(\d{2})\/(\d{2})\b/g, (trecho, dia: string, mes: string) => {
    const m = Number(mes);
    const d = Number(dia);
    if (m < 1 || m > 12 || d < 1 || d > 31) return trecho;
    // Data de janeiro num lançamento de dezembro é do ano seguinte, e vice-versa.
    const anoDaData = mesDoD0 >= 11 && m <= 2 ? ano + 1 : mesDoD0 <= 2 && m >= 11 ? ano - 1 : ano;
    const nova = somarDias(`${anoDaData}-${mes}-${dia}`, dias);
    return `${nova.slice(8, 10)}/${nova.slice(5, 7)}`;
  });
}

type Turma = {
  nome: string;
  // Fim das vendas de ingressos da turma (vazio: o D0).
  fim_vendas?: string | null;
  d0: string;
  de0: string;
  dp0: string | null;
  dfc: string;
  meta_filtro: string | null;
};

// O que muda da turma atual para a próxima. O resto (metas, produtos da Berry,
// conta de anúncios) é copiado igual.
export function proximaTurma(atual: Turma) {
  const d0 = somarDias(atual.d0, DIAS_ENTRE_TURMAS);
  return {
    nome: nomeDaTurma(atual.nome, d0),
    d0,
    de0: somarDias(atual.de0, DIAS_ENTRE_TURMAS),
    dp0: atual.dp0 ? somarDias(atual.dp0, DIAS_ENTRE_TURMAS) : null,
    dfc: somarDias(atual.dfc, DIAS_ENTRE_TURMAS),
    // Os ingressos da próxima turma começam a contar no dia seguinte ao fim das
    // vendas desta: é assim que as vendas do mesmo produto se dividem entre as
    // turmas, sem deixar nenhum dia de fora.
    dv0: somarDias(atual.fim_vendas ?? atual.d0, 1),
    meta_filtro: deslocarDatasDoFiltro(atual.meta_filtro, atual.d0),
  };
}
