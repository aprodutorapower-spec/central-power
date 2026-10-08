import { avisosParaAsana, type Aviso, type NomeRotina } from "./avisos";
import { hoje } from "./datas";
import type { Lancamento } from "./marcos";
import { criarClienteAdmin } from "./supabase/admin";

// Só para o servidor (chave de serviço).

// Cada rotina marca que rodou; é assim que se percebe quando uma para.
export async function registrarRotina(nome: NomeRotina) {
  await criarClienteAdmin()
    .from("rotinas")
    .upsert({ nome, ultima_execucao: new Date().toISOString() });
}

// Compara os problemas de agora com os já registrados: o que foi resolvido
// sai, o que é novo entra, e devolve os que ainda não viraram tarefa.
export async function avisosPendentes(): Promise<Aviso[]> {
  const admin = criarClienteAdmin();
  const [{ data: lancamentos }, { data: rotinas }, { data: registrados }] = await Promise.all([
    admin.from("lancamentos").select("*, experts(nome)").eq("situacao", "ativo"),
    admin.from("rotinas").select("nome, ultima_execucao"),
    admin.from("avisos").select("chave, avisado_em"),
  ]);
  if (!lancamentos || !rotinas || !registrados) throw new Error("Falha ao ler o banco.");

  const atuais = avisosParaAsana({
    lancamentos: lancamentos as (Lancamento & { experts: { nome: string } })[],
    rotinas,
    hoje: hoje(),
    agora: new Date(),
  });

  const chavesAtuais = new Set(atuais.map((a) => a.chave));
  const resolvidos = registrados.filter((r) => !chavesAtuais.has(r.chave)).map((r) => r.chave);
  if (resolvidos.length) await admin.from("avisos").delete().in("chave", resolvidos);

  const conhecidos = new Map(registrados.map((r) => [r.chave, r.avisado_em]));
  const novos = atuais.filter((a) => !conhecidos.has(a.chave));
  if (novos.length) await admin.from("avisos").insert(novos);

  return atuais.filter((a) => !conhecidos.get(a.chave));
}

export async function marcarAvisados(chaves: string[]) {
  if (!chaves.length) return;
  await criarClienteAdmin()
    .from("avisos")
    .update({ avisado_em: new Date().toISOString() })
    .in("chave", chaves);
}
