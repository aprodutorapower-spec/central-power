import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { diaDe, somarDias } from "./datas";
import { criarClienteAdmin } from "./supabase/admin";

// Só para o servidor: conversa com a Berry Pay e guarda as chaves de API.
const BASE = process.env.BERRY_API_URL ?? "https://api.berrypay.com.br/v1";

export class ErroBerry extends Error {}

const MENSAGENS: Record<number, string> = {
  401: "A Berry não reconheceu essa chave. Confira se copiou inteira ou peça uma nova ao suporte da Berry.",
  403: "Essa chave não tem permissão de leitura. Peça ao suporte da Berry uma chave com leitura.",
  429: "A Berry pediu para esperar um pouco. Tente de novo em um minuto.",
};

function segredo() {
  const valor = Buffer.from(process.env.BERRY_SEGREDO ?? "", "base64");
  if (valor.length !== 32) throw new Error("BERRY_SEGREDO não configurada");
  return valor;
}

export function cifrarChave(chave: string) {
  const iv = randomBytes(12);
  const cifra = createCipheriv("aes-256-gcm", segredo(), iv);
  const corpo = Buffer.concat([cifra.update(chave, "utf8"), cifra.final()]);
  return [iv, cifra.getAuthTag(), corpo]
    .map((parte) => parte.toString("base64"))
    .join(".");
}

function decifrarChave(texto: string) {
  const [iv, selo, corpo] = texto.split(".").map((p) => Buffer.from(p, "base64"));
  const cifra = createDecipheriv("aes-256-gcm", segredo(), iv);
  cifra.setAuthTag(selo);
  return Buffer.concat([cifra.update(corpo), cifra.final()]).toString("utf8");
}

// Ignora as regras de acesso do banco: chamar só depois de conferir que quem
// pediu enxerga o expert.
export async function chaveDoExpert(expertId: string) {
  const { data } = await criarClienteAdmin()
    .from("berry_conexoes")
    .select("chave_cifrada")
    .eq("expert_id", expertId)
    .maybeSingle();
  return data ? decifrarChave(data.chave_cifrada) : null;
}

async function chamar<T>(chave: string, caminho: string): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      headers: { Authorization: `Bearer ${chave}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ErroBerry(
      "Não consegui falar com a Berry agora. Tente de novo em instantes.",
    );
  }
  if (!resposta.ok) {
    throw new ErroBerry(
      MENSAGENS[resposta.status] ??
        "A Berry respondeu com erro. Tente de novo em instantes.",
    );
  }
  return (await resposta.json()) as T;
}

export type ProdutoBerry = { id: string; nome: string; ativo: boolean };

export async function listarProdutos(chave: string): Promise<ProdutoBerry[]> {
  const { data } = await chamar<{
    data: { id: string; name: string; status: string }[];
  }>(chave, "/products");

  return data
    .map((produto) => ({
      id: produto.id,
      nome: produto.name,
      ativo: produto.status === "ACTIVE",
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

// Quantas vendas pagas contêm o produto, desde a data informada (ou desde sempre).
export async function contarVendasPagas(
  chave: string,
  produtoId: string,
  desde: string | null,
) {
  const filtros = new URLSearchParams({
    status: "paid",
    productId: produtoId,
    limit: "1",
  });
  if (desde) filtros.set("startDate", desde);

  const { pagination } = await chamar<{ pagination: { total: number } }>(
    chave,
    `/transactions?${filtros}`,
  );
  return pagination.total;
}

// Teto de páginas por consulta (100 vendas cada): protege contra laço sem fim
// e respeita o limite de 60 chamadas por minuto da Berry.
const MAXIMO_PAGINAS = 40;

type TransacaoBerry = {
  id: string;
  created_at: string;
  amounts: { subtotal: number; discount: number };
  items: { product_id: string; quantity: number; amount: number }[];
};

// Todas as vendas pagas que contêm um produto, num período. As datas são dias
// de calendário (AAAA-MM-DD); o fim é inclusivo.
async function vendasPagas(
  chave: string,
  produtoId: string,
  desde: string | null,
  ate: string | null,
) {
  const vendas: TransacaoBerry[] = [];
  for (let pagina = 1; pagina <= MAXIMO_PAGINAS; pagina += 1) {
    const filtros = new URLSearchParams({
      status: "paid",
      productId: produtoId,
      limit: "100",
      page: String(pagina),
    });
    if (desde) filtros.set("startDate", desde);
    // A Berry corta o dia pelo horário UTC (21h de Brasília). Com data final,
    // pede um dia a mais e separa aqui pelo dia de Brasília.
    if (ate) filtros.set("endDate", somarDias(ate, 1));

    const { data, pagination } = await chamar<{
      data: TransacaoBerry[];
      pagination: { total_pages: number };
    }>(chave, `/transactions?${filtros}`);
    vendas.push(...data);
    if (pagina >= pagination.total_pages) break;
  }
  if (!ate) return vendas;
  // Período fechado (turma do semanal, produto principal): vale o dia de
  // Brasília em que a compra foi feita, nas duas pontas.
  return vendas.filter((venda) => {
    const dia = diaDe(venda.created_at);
    return dia <= ate && (!desde || dia >= desde);
  });
}

export type ConsultaDeVendas = {
  // Produto do ingresso (null em lançamento gratuito, que não vende ingresso).
  ingresso: string | null;
  // Outros produtos que somam na receita de ingressos (gravação etc.).
  extras: string[];
  // Período da venda de ingressos; `ate` vazio conta até hoje.
  desde: string | null;
  ate: string | null;
  // Produto principal e o período em que ele é vendido (do evento ao fim do carrinho).
  principais: string[];
  principalDesde: string | null;
  principalAte: string | null;
};

// Vendas pagas do lançamento.
// - ingressos: quantidade vendida do produto do ingresso;
// - receita: tudo o que entrou nas compras do ingresso (ingresso + order bumps,
//   já com desconto), mais as compras dos produtos extras feitas à parte. Uma
//   compra nunca é somada duas vezes;
// - receitaSoIngressos: só a parte do ingresso;
// - vendasPrincipal / faturamentoPrincipal: produto principal (null quando
//   nenhum foi escolhido).
export async function resumoDeVendas(chave: string, consulta: ConsultaDeVendas) {
  let ingressos = 0;
  let centavos = 0;
  let centavosSoIngressos = 0;
  const somadas = new Set<string>();

  if (consulta.ingresso) {
    for (const venda of await vendasPagas(chave, consulta.ingresso, consulta.desde, consulta.ate)) {
      somadas.add(venda.id);
      centavos += venda.amounts.subtotal - venda.amounts.discount;
      for (const item of venda.items) {
        if (item.product_id !== consulta.ingresso) continue;
        ingressos += item.quantity;
        centavosSoIngressos += item.amount;
      }
    }
    for (const extra of consulta.extras) {
      for (const venda of await vendasPagas(chave, extra, consulta.desde, consulta.ate)) {
        // Extra comprado junto com o ingresso já entrou na compra do ingresso.
        if (somadas.has(venda.id)) continue;
        somadas.add(venda.id);
        centavos += venda.amounts.subtotal - venda.amounts.discount;
      }
    }
  }

  let vendasPrincipal: number | null = null;
  let centavosPrincipal = 0;
  if (consulta.principais.length) {
    vendasPrincipal = 0;
    const contadas = new Set<string>();
    for (const principal of consulta.principais) {
      for (const venda of await vendasPagas(
        chave,
        principal,
        consulta.principalDesde,
        consulta.principalAte,
      )) {
        if (contadas.has(venda.id)) continue;
        contadas.add(venda.id);
        for (const item of venda.items) {
          if (!consulta.principais.includes(item.product_id)) continue;
          vendasPrincipal += item.quantity;
          centavosPrincipal += item.amount;
        }
      }
    }
  }

  return {
    ingressos,
    receita: centavos / 100,
    receitaSoIngressos: centavosSoIngressos / 100,
    vendasPrincipal,
    faturamentoPrincipal: vendasPrincipal == null ? null : centavosPrincipal / 100,
  };
}
