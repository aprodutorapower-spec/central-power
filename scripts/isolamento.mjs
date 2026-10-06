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
