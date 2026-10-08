import { revalidatePath } from "next/cache";
import { registrarRotina } from "@/lib/avisos-sincronia";
import { sincronizarTodos } from "@/lib/berry-sincronia";

// Rotina automática: puxa da Berry os ingressos e a receita de todos os
// lançamentos ativos. Quem chama é o agendador (ver vercel.json), que se
// identifica com o segredo CRON_SECRET. Sem o segredo, ninguém roda.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return new Response("Não autorizado", { status: 401 });
  }

  const resultados = await sincronizarTodos();
  await registrarRotina("berry");
  revalidatePath("/", "layout");

  // Só situação e contagem: nada de dados de compradores.
  return Response.json({
    lancamentos: resultados.length,
    atualizados: resultados.filter((r) => r.situacao === "atualizado").length,
    erros: resultados.filter((r) => r.situacao === "erro").length,
    detalhes: resultados.map((r) => ({ nome: r.nome, situacao: r.situacao })),
  });
}
