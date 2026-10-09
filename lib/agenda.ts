import { SITE } from "./avisos";
import { avisosDeConexao } from "./conexoes";
import { hoje, somarDias } from "./datas";
import { montarLinhaDoTempo, tituloDoItem, type Checkpoint, type ItemLinha } from "./linha-do-tempo";
import type { Foto } from "./metricas";
import { montarItens, type LancamentoDoPainel } from "./painel";
import { criarClienteAdmin } from "./supabase/admin";
import { FAIXAS } from "./urgencia";

// Só para o servidor. Agenda do dia para o robô de WhatsApp do Ricardo: o que
// cada lançamento ativo tem na linha do tempo hoje e amanhã, com a situação e
// as pendências já calculadas pelas mesmas regras das telas. O robô só lê e
// monta a mensagem; não recalcula nada.

function evento(item: ItemLinha) {
  return item.tipo === "marco"
    ? { tipo: "marco" as const, titulo: tituloDoItem(item), descricao: null, estado: null }
    : {
        tipo: "checkpoint" as const,
        titulo: item.checkpoint.titulo,
        descricao: item.checkpoint.descricao || null,
        estado: item.checkpoint.estado,
      };
}

export async function agendaDoDia(dia = hoje()) {
  const admin = criarClienteAdmin();
  const [{ data: lancamentos }, { data: estrategistas }, { data: checkpoints }, { data: fotos }] =
    await Promise.all([
      admin.from("lancamentos").select("*, experts(nome, estrategista_id)").eq("situacao", "ativo"),
      admin.from("perfis").select("id, nome").eq("papel", "estrategista"),
      admin
        .from("checkpoints")
        .select("*, lancamentos!inner(situacao)")
        .eq("lancamentos.situacao", "ativo"),
      admin
        .from("fotos_metricas")
        .select("*, lancamentos!inner(situacao)")
        .eq("lancamentos.situacao", "ativo"),
    ]);
  if (!lancamentos || !estrategistas || !checkpoints || !fotos) {
    throw new Error("Falha ao ler o banco.");
  }

  const nomes = new Map(estrategistas.map((e) => [e.id as string, e.nome as string]));
  const amanha = somarDias(dia, 1);
  const agora = new Date();

  const itens = montarItens({
    lancamentos: lancamentos as LancamentoDoPainel[],
    checkpoints: checkpoints as Checkpoint[],
    fotos: fotos as Foto[],
    hoje: dia,
  });

  return {
    dia,
    amanha,
    // Do mais urgente para o menos, como nas telas.
    lancamentos: itens.map((item) => {
      const { lancamento: l, urgencia: u } = item;
      const linha = montarLinhaDoTempo(l, item.checkpoints, dia).itens;
      const doDia = (data: string) => linha.filter((i) => i.data === data).map(evento);
      const eventosHoje = doDia(dia);
      const eventosAmanha = doDia(amanha);
      return {
        lancamento_id: l.id,
        expert: item.expert,
        lancamento: l.nome,
        tipo: l.tipo,
        estrategista: item.estrategistaId
          ? { id: item.estrategistaId, nome: nomes.get(item.estrategistaId) ?? null }
          : null,
        d0: l.d0,
        dias_ate_d0: u.diasAteD0,
        tem_evento_hoje: eventosHoje.length > 0,
        tem_evento_amanha: eventosAmanha.length > 0,
        hoje: eventosHoje,
        amanha: eventosAmanha,
        situacao: FAIXAS[u.faixa].rotulo,
        // A frase que aparece no cartão: o que está abaixo da meta ou parado.
        motivo: u.motivo,
        abaixo_da_meta: u.faixa === "abaixo",
        checkpoints_atrasados: item.atrasados,
        avisos_de_conexao: avisosDeConexao(l, dia, agora).map((aviso) => aviso.texto),
        numeros: {
          ingressos_vendidos: u.ingressos.vendidos,
          meta_ingressos: u.ingressos.meta,
          ingressos_esperados_ate_hoje:
            u.ingressos.esperado == null ? null : Math.round(u.ingressos.esperado),
          cpa: u.cpa.atual == null ? null : Math.round(u.cpa.atual * 100) / 100,
          meta_cpa: u.cpa.meta == null ? null : Math.round(u.cpa.meta * 100) / 100,
          verba_investida: item.foto?.verba_investida ?? null,
          grupo_whatsapp: u.grupo.pessoas,
          grupo_whatsapp_proporcao:
            u.grupo.proporcao == null ? null : Math.round(u.grupo.proporcao * 100) / 100,
        },
        link: `${SITE}/lancamentos/${l.id}`,
      };
    }),
  };
}
