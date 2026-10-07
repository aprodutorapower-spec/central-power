import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
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
