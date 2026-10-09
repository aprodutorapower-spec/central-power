import { revalidatePath } from "next/cache";
import { registrarRotina } from "@/lib/avisos-sincronia";
import {
  gravarVerbaDoMeta,
  lancamentosDoMeta,
  registrarErroDoMeta,
} from "@/lib/meta-sincronia";

// Porta da rotina do Meta Ads (uma tarefa agendada do Claude, 3x ao dia).
// GET devolve o que consultar; POST recebe os gastos das campanhas de um
// lançamento, ou o erro quando o Meta não deixou consultar. Quem chama se identifica com o segredo META_ROTINA_SEGREDO,
// que só serve para isto.
export const dynamic = "force-dynamic";

function autorizado(request: Request) {
  const segredo = process.env.META_ROTINA_SEGREDO;
  return Boolean(segredo) && request.headers.get("authorization") === `Bearer ${segredo}`;
}

export async function GET(request: Request) {
  if (!autorizado(request)) return new Response("Não autorizado", { status: 401 });
  // A rotina pedir a lista já prova que ela está viva.
  await registrarRotina("meta");
  return Response.json({ lancamentos: await lancamentosDoMeta() });
}

export async function POST(request: Request) {
  if (!autorizado(request)) return new Response("Não autorizado", { status: 401 });

  const corpo = (await request.json().catch(() => null)) as {
    lancamento_id?: unknown;
    campanhas?: unknown;
    erro?: unknown;
  } | null;
  const id = typeof corpo?.lancamento_id === "string" ? corpo.lancamento_id : "";
  // A rotina não conseguiu consultar o Meta para este lançamento.
  if (id && typeof corpo?.erro === "string" && corpo.erro.trim()) {
    await registrarErroDoMeta(id, corpo.erro);
    revalidatePath("/", "layout");
    return Response.json({ situacao: "erro_registrado" });
  }
  if (!id || !Array.isArray(corpo?.campanhas) || corpo.campanhas.length > 2000) {
    return Response.json({ situacao: "erro", erro: "Pedido inválido." }, { status: 400 });
  }
  const campanhas = corpo.campanhas.map((c) => ({
    nome: String((c as { nome?: unknown })?.nome ?? ""),
    gasto: Number((c as { gasto?: unknown })?.gasto),
    compras:
      (c as { compras?: unknown })?.compras == null
        ? null
        : Number((c as { compras?: unknown }).compras),
  }));

  const resultado = await gravarVerbaDoMeta(id, campanhas);
  if (resultado.situacao === "atualizado") revalidatePath("/", "layout");
  return Response.json(resultado);
}
