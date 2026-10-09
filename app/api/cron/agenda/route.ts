import { agendaDoDia } from "@/lib/agenda";

// Porta de leitura para o robô de WhatsApp do Ricardo: a agenda do dia de
// todos os lançamentos ativos (o que acontece hoje e amanhã, situação e
// pendências). Só leitura. Quem chama se identifica com o segredo ROBO_SEGREDO,
// que só serve para isto; o robô não recebe nenhuma chave do banco.
export const dynamic = "force-dynamic";

const DATA = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const segredo = process.env.ROBO_SEGREDO;
  if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return new Response("Não autorizado", { status: 401 });
  }

  // ?dia=AAAA-MM-DD consulta outro dia (por exemplo, para testar); sem isso, hoje.
  const dia = new URL(request.url).searchParams.get("dia");
  if (dia && !DATA.test(dia)) {
    return Response.json({ erro: "Use dia=AAAA-MM-DD." }, { status: 400 });
  }
  return Response.json(await agendaDoDia(dia ?? undefined));
}
