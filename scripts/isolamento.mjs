// Prova de isolamento entre estrategistas, direto nas regras do banco.
// Cria usuários e dados FICTÍCIOS, testa e apaga tudo no final.
// Rodar com: node --env-file=.env.local scripts/isolamento.mjs
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICO = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !ANON || !SERVICO) {
  console.error("Faltam variáveis de ambiente (ver .env.example).");
  process.exit(1);
}

const semSessao = { auth: { autoRefreshToken: false, persistSession: false } };
const servico = createClient(URL, SERVICO, semSessao);
const MARCA = "TESTE ISOLAMENTO";
let falhas = 0;

function confere(descricao, ok) {
  console.log(`${ok ? "ok   " : "FALHA"} ${descricao}`);
  if (!ok) falhas += 1;
}

async function criarPessoa(apelido, papel) {
  const email = `isolamento-${apelido}-${randomBytes(4).toString("hex")}@example.com`;
  const senha = randomBytes(18).toString("base64url");
  const { data, error } = await servico.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });
  if (error) throw error;
  const { data: perfil, error: erroPerfil } = await servico
    .from("perfis")
    .insert({ nome: `${MARCA} ${apelido}`, email, papel, user_id: data.user.id })
    .select("id")
    .single();
  if (erroPerfil) throw erroPerfil;

  const cliente = createClient(URL, ANON, semSessao);
  const { error: erroLogin } = await cliente.auth.signInWithPassword({
    email,
    password: senha,
  });
  if (erroLogin) throw erroLogin;
  return { userId: data.user.id, perfilId: perfil.id, cliente };
}

async function limpar() {
  await servico.from("experts").delete().like("nome", `${MARCA}%`);
  const { data: perfis } = await servico
    .from("perfis")
    .select("id, user_id")
    .like("nome", `${MARCA}%`);
  for (const perfil of perfis ?? []) {
    await servico.from("perfis").delete().eq("id", perfil.id);
    if (perfil.user_id) await servico.auth.admin.deleteUser(perfil.user_id);
  }
}

async function testar() {
  const a = await criarPessoa("A", "estrategista");
  const b = await criarPessoa("B", "estrategista");
  const admin = await criarPessoa("ADMIN", "admin");

  const { data: semente } = await servico
    .from("experts")
    .insert([
      { nome: `${MARCA} expert de A`, estrategista_id: a.perfilId },
      { nome: `${MARCA} expert de B`, estrategista_id: b.perfilId },
    ])
    .select("id, estrategista_id");
  const expertA = semente.find((e) => e.estrategista_id === a.perfilId);
  const expertB = semente.find((e) => e.estrategista_id === b.perfilId);

  // Sem login
  const anonimo = createClient(URL, ANON, semSessao);
  for (const tabela of ["perfis", "experts"]) {
    const { data } = await anonimo.from(tabela).select("id");
    confere(`sem login não lê ${tabela}`, !data?.length);
  }

  // Estrategista A
  const { data: expertsDeA } = await a.cliente.from("experts").select("id");
  confere(
    "A lê só o próprio expert",
    expertsDeA?.length === 1 && expertsDeA[0].id === expertA.id,
  );

  const { data: perfisDeA } = await a.cliente.from("perfis").select("id");
  confere(
    "A lê só o próprio perfil",
    perfisDeA?.length === 1 && perfisDeA[0].id === a.perfilId,
  );

  const { data: alterouB } = await a.cliente
    .from("experts")
    .update({ nome: `${MARCA} invadido` })
    .eq("id", expertB.id)
    .select("id");
  confere("A não altera expert de B", !alterouB?.length);

  const { error: criouParaB } = await a.cliente
    .from("experts")
    .insert({ nome: `${MARCA} indevido`, estrategista_id: b.perfilId });
  confere("A não cria expert em nome de B", Boolean(criouParaB));

  const { error: transferiu } = await a.cliente
    .from("experts")
    .update({ estrategista_id: b.perfilId })
    .eq("id", expertA.id);
  confere("A não transfere o próprio expert para B", Boolean(transferiu));

  const { data: criouProprio } = await a.cliente
    .from("experts")
    .insert({ nome: `${MARCA} novo de A`, estrategista_id: a.perfilId })
    .select("id");
  confere("A cria expert próprio", criouProprio?.length === 1);

  const { data: apagou } = await a.cliente
    .from("experts")
    .delete()
    .eq("id", expertA.id)
    .select("id");
  confere("A não apaga expert (só admin)", !apagou?.length);

  const { data: virouAdmin } = await a.cliente
    .from("perfis")
    .update({ papel: "admin" })
    .eq("id", a.perfilId)
    .select("id");
  confere("A não se promove a admin", !virouAdmin?.length);

  // Lançamentos (seguem o expert)
  const modelo = { tipo: "LPS", de0: "2030-01-07", d0: "2030-01-14", dp0: "2030-01-20", dfc: "2030-01-22" };
  const { data: lancB } = await servico
    .from("lancamentos")
    .insert({ ...modelo, nome: `${MARCA} lançamento de B`, expert_id: expertB.id })
    .select("id")
    .single();

  const { data: lancA } = await a.cliente
    .from("lancamentos")
    .insert({ ...modelo, nome: `${MARCA} lançamento de A`, expert_id: expertA.id })
    .select("id");
  confere("A cria lançamento no próprio expert", lancA?.length === 1);

  const { data: lancamentosDeA } = await a.cliente.from("lancamentos").select("id");
  confere(
    "A lê só os próprios lançamentos",
    lancamentosDeA?.length === 1 && lancamentosDeA[0].id === lancA?.[0]?.id,
  );

  const { error: lancIndevido } = await a.cliente
    .from("lancamentos")
    .insert({ ...modelo, nome: `${MARCA} indevido`, expert_id: expertB.id });
  confere("A não cria lançamento em expert de B", Boolean(lancIndevido));

  const { data: alterouLancB } = await a.cliente
    .from("lancamentos")
    .update({ nome: `${MARCA} invadido` })
    .eq("id", lancB.id)
    .select("id");
  confere("A não altera lançamento de B", !alterouLancB?.length);

  const { error: moveu } = await a.cliente
    .from("lancamentos")
    .update({ expert_id: expertB.id })
    .eq("id", lancA?.[0]?.id);
  confere("A não move lançamento para expert de B", Boolean(moveu));

  // Metas: só o admin define; o que o estrategista manda é ignorado
  const { data: lancComMeta } = await a.cliente
    .from("lancamentos")
    .insert({ ...modelo, nome: `${MARCA} com meta indevida`, expert_id: expertA.id, meta_ingressos: 999, meta_cpa: 9 })
    .select("id, meta_ingressos, meta_cpa");
  confere(
    "A não define metas ao criar lançamento",
    lancComMeta?.length === 1 && lancComMeta[0].meta_ingressos === null && lancComMeta[0].meta_cpa === null,
  );
  await servico.from("lancamentos").delete().eq("id", lancComMeta?.[0]?.id);

  const { data: metaDoAdmin } = await admin.cliente
    .from("lancamentos")
    .update({ meta_ingressos: 300, meta_cpa: 40, inicio_vendas: "2030-01-01" })
    .eq("id", lancA?.[0]?.id)
    .select("meta_ingressos, meta_cpa");
  confere(
    "admin define as metas",
    metaDoAdmin?.[0]?.meta_ingressos === 300 && Number(metaDoAdmin?.[0]?.meta_cpa) === 40,
  );

  const { data: metaDeA } = await a.cliente
    .from("lancamentos")
    .update({ nome: `${MARCA} lançamento de A`, meta_ingressos: 1, meta_cpa: 999, inicio_vendas: null, fim_vendas: "2030-02-01" })
    .eq("id", lancA?.[0]?.id)
    .select("meta_ingressos, meta_cpa, inicio_vendas, fim_vendas");
  confere(
    "A edita o próprio lançamento, mas não muda as metas",
    metaDeA?.[0]?.meta_ingressos === 300 &&
      Number(metaDeA?.[0]?.meta_cpa) === 40 &&
      metaDeA?.[0]?.inicio_vendas === "2030-01-01" &&
      metaDeA?.[0]?.fim_vendas === null,
  );

  // Checkpoints (seguem o lançamento) e modelos (só admin)
  const { data: cpsDeA } = await a.cliente
    .from("checkpoints")
    .select("id, lancamento_id");
  confere(
    "lançamento novo de A nasce com checkpoints, e A lê só os dele",
    cpsDeA?.length > 0 && cpsDeA.every((c) => c.lancamento_id === lancA?.[0]?.id),
  );

  const { data: cpDeB } = await servico
    .from("checkpoints")
    .select("id")
    .eq("lancamento_id", lancB.id)
    .limit(1)
    .single();

  const { data: marcouB } = await a.cliente
    .from("checkpoints")
    .update({ estado: "feito" })
    .eq("id", cpDeB.id)
    .select("id");
  confere("A não marca checkpoint de B", !marcouB?.length);

  const { data: marcouProprio } = await a.cliente
    .from("checkpoints")
    .update({ estado: "feito" })
    .eq("id", cpsDeA?.[0]?.id)
    .select("id");
  confere("A marca checkpoint próprio", marcouProprio?.length === 1);

  const { error: moveuCp } = await a.cliente
    .from("checkpoints")
    .update({ lancamento_id: lancB.id })
    .eq("id", cpsDeA?.[0]?.id);
  confere("A não move checkpoint para lançamento de B", Boolean(moveuCp));

  const { data: modelosDeA } = await a.cliente.from("checkpoint_modelos").select("id");
  confere("A não lê os modelos (só admin)", !modelosDeA?.length);

  const { data: alterouModelo } = await a.cliente
    .from("checkpoint_modelos")
    .update({ titulo: `${MARCA} invadido` })
    .neq("titulo", "")
    .select("id");
  confere("A não altera os modelos", !alterouModelo?.length);

  for (const tabela of ["checkpoints", "checkpoint_modelos"]) {
    const { data } = await anonimo.from(tabela).select("id");
    confere(`sem login não lê ${tabela}`, !data?.length);
  }

  const { data: modelosDoAdmin } = await admin.cliente
    .from("checkpoint_modelos")
    .select("id");
  confere("admin lê os modelos", modelosDoAdmin?.length > 0);

  const { data: cpsDoAdmin } = await admin.cliente
    .from("checkpoints")
    .select("lancamento_id")
    .in("lancamento_id", [lancA?.[0]?.id, lancB.id]);
  confere(
    "admin lê os checkpoints de todos",
    new Set((cpsDoAdmin ?? []).map((c) => c.lancamento_id)).size === 2,
  );

  // Fotos de métricas (seguem o lançamento; histórico não é reescrito)
  const { data: fotoB } = await servico
    .from("fotos_metricas")
    .insert({ lancamento_id: lancB.id, data: "2030-01-10", verba_investida: 100, ingressos_vendidos: 4, receita_ingressos: 200 })
    .select("id")
    .single();

  const { data: fotoA } = await a.cliente
    .from("fotos_metricas")
    .insert({ lancamento_id: lancA?.[0]?.id, data: "2030-01-10", verba_investida: 50, ingressos_vendidos: 0, receita_ingressos: 0 })
    .select("id");
  confere("A registra foto no próprio lançamento", fotoA?.length === 1);

  const { data: fotosDeA } = await a.cliente.from("fotos_metricas").select("id");
  confere(
    "A lê só as próprias fotos",
    fotosDeA?.length === 1 && fotosDeA[0].id === fotoA?.[0]?.id,
  );

  const { error: fotoIndevida } = await a.cliente
    .from("fotos_metricas")
    .insert({ lancamento_id: lancB.id, data: "2030-01-10", verba_investida: 1 });
  confere("A não registra foto em lançamento de B", Boolean(fotoIndevida));

  const { data: reescreveu } = await a.cliente
    .from("fotos_metricas")
    .update({ verba_investida: 1 })
    .eq("id", fotoA?.[0]?.id)
    .select("id");
  confere("A não reescreve o histórico (só admin)", !reescreveu?.length);

  const { data: anonFotos } = await anonimo.from("fotos_metricas").select("id");
  confere("sem login não lê fotos_metricas", !anonFotos?.length);

  const { data: fotosDoAdmin } = await admin.cliente
    .from("fotos_metricas")
    .select("id")
    .in("id", [fotoA?.[0]?.id, fotoB.id]);
  confere("admin lê as fotos de todos", fotosDoAdmin?.length === 2);

  // Conexão com a Berry (segue o expert; a chave nunca é lida por quem está logado)
  await servico.from("berry_conexoes").insert([
    { expert_id: expertA.id, chave_cifrada: "ficticia-a", chave_final: "aaaa" },
    { expert_id: expertB.id, chave_cifrada: "ficticia-b", chave_final: "bbbb" },
  ]);

  const { data: berryDeA } = await a.cliente
    .from("berry_conexoes")
    .select("expert_id, chave_final");
  confere(
    "A vê só a situação da Berry do próprio expert",
    berryDeA?.length === 1 && berryDeA[0].expert_id === expertA.id,
  );

  for (const [quem, cliente] of [["A", a.cliente], ["admin", admin.cliente]]) {
    const { data, error } = await cliente.from("berry_conexoes").select("chave_cifrada");
    confere(`${quem} não lê a chave da Berry`, Boolean(error) && !data?.length);
  }

  const { error: berryIndevida } = await a.cliente
    .from("berry_conexoes")
    .insert({ expert_id: criouProprio?.[0]?.id, chave_cifrada: "x", chave_final: "x" });
  confere("A não grava chave da Berry direto no banco", Boolean(berryIndevida));

  const { data: berryAlterada, error: berryAlteradaErro } = await a.cliente
    .from("berry_conexoes")
    .update({ chave_final: "zzzz" })
    .eq("expert_id", expertA.id)
    .select("expert_id");
  confere(
    "A não altera a conexão da Berry direto no banco",
    Boolean(berryAlteradaErro) || !berryAlterada?.length,
  );

  const { data: berryApagada, error: berryApagadaErro } = await a.cliente
    .from("berry_conexoes")
    .delete()
    .eq("expert_id", expertA.id)
    .select("expert_id");
  confere(
    "A não apaga a conexão da Berry direto no banco",
    Boolean(berryApagadaErro) || !berryApagada?.length,
  );

  const { data: anonBerry } = await anonimo.from("berry_conexoes").select("expert_id");
  confere("sem login não lê berry_conexoes", !anonBerry?.length);

  const { data: berryDoAdmin } = await admin.cliente
    .from("berry_conexoes")
    .select("expert_id")
    .in("expert_id", [expertA.id, expertB.id]);
  confere("admin vê a situação da Berry de todos", berryDoAdmin?.length === 2);

  const { data: anonPerfil, error: anonPerfilErro } = await anonimo.rpc("meu_perfil");
  confere("sem login não consulta perfil", Boolean(anonPerfilErro) || !anonPerfil?.length);

  const { data: anonLanc } = await anonimo.from("lancamentos").select("id");
  confere("sem login não lê lancamentos", !anonLanc?.length);

  const { data: lancDoAdmin } = await admin.cliente
    .from("lancamentos")
    .select("id")
    .like("nome", `${MARCA}%`);
  confere("admin lê os lançamentos de todos", lancDoAdmin?.length === 2);

  // Admin
  const { data: expertsDoAdmin } = await admin.cliente
    .from("experts")
    .select("id")
    .like("nome", `${MARCA}%`);
  confere("admin lê os experts de todos", expertsDoAdmin?.length === 3);

  const { data: perfisDoAdmin } = await admin.cliente
    .from("perfis")
    .select("id")
    .like("nome", `${MARCA}%`);
  confere("admin lê os perfis de todos", perfisDoAdmin?.length === 3);
}

try {
  await limpar();
  await testar();
} catch (erro) {
  console.error("Erro ao rodar o teste:", erro.message ?? erro);
  falhas += 1;
} finally {
  await limpar();
}

console.log(falhas ? `\n${falhas} falha(s).` : "\nIsolamento confirmado.");
process.exit(falhas ? 1 : 0);
