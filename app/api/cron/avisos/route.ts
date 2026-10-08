import {
  avisosPendentes,
  marcarAvisados,
  registrarRotina,
} from "@/lib/avisos-sincronia";

// Porta da rotina de avisos (uma tarefa agendada do Claude, com o conector do
// Asana, 3x ao dia). GET devolve os problemas que ainda não viraram tarefa;
// POST marca os que a rotina acabou de criar no Asana. Usa o mesmo segredo da
// rotina do Meta Ads (META_ROTINA_SEGREDO): as duas são rotinas do Claude.
export const dynamic = "force-dynamic";

function autorizado(request: Request) {
  const segredo = process.env.META_ROTINA_SEGREDO;
  return Boolean(segredo) && request.headers.get("authorization") === `Bearer ${segredo}`;
}

export async function GET(request: Request) {
  if (!autorizado(request)) return new Response("Não autorizado", { status: 401 });
  const avisos = await avisosPendentes();
  await registrarRotina("avisos");
  return Response.json({
    avisos: avisos.map(({ chave, titulo, detalhe }) => ({ chave, titulo, detalhe })),
  });
}

export async function POST(request: Request) {
  if (!autorizado(request)) return new Response("Não autorizado", { status: 401 });
  const corpo = (await request.json().catch(() => null)) as { chaves?: unknown } | null;
  if (!Array.isArray(corpo?.chaves) || corpo.chaves.length > 200) {
    return Response.json({ situacao: "erro", erro: "Pedido inválido." }, { status: 400 });
  }
  const chaves = corpo.chaves.map(String);
  await marcarAvisados(chaves);
  return Response.json({ situacao: "ok", marcados: chaves.length });
}
