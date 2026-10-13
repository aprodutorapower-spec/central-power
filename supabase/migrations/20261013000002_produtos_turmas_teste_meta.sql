-- 1. Mais produtos da Berry por lançamento (sugestão do Alexandre, 13/10/2026):
--    berry_extras:     produtos que somam na receita de ingressos (gravação etc.)
--    berry_principais: produto principal vendido no evento (vendas, faturamento e CAC)
--    Cada um é uma lista de {"id": "...", "nome": "..."}.
-- 2. Turmas do lançamento semanal: turma_de aponta para a turma anterior.
-- 3. Teste de conexão com a conta de anúncios do Meta, pedido pela tela:
--    meta_teste_conta / meta_teste_pedido_em: o que foi pedido e quando
--    meta_teste_feito_em / meta_teste_ok / meta_teste_detalhe: a resposta da rotina
alter table public.lancamentos
  add column berry_extras jsonb not null default '[]'::jsonb,
  add column berry_principais jsonb not null default '[]'::jsonb,
  add column turma_de uuid references public.lancamentos(id) on delete set null,
  add column meta_teste_conta text,
  add column meta_teste_pedido_em timestamptz,
  add column meta_teste_feito_em timestamptz,
  add column meta_teste_ok boolean,
  add column meta_teste_detalhe text;

create index lancamentos_turma_de_idx on public.lancamentos (turma_de);

-- Só o servidor escreve o estado das conexões e dos testes.
create or replace function public.proteger_estado_conexoes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.berry_conferido_em := null;
    new.berry_erro := null;
    new.meta_conferido_em := null;
    new.meta_erro := null;
    new.meta_campanhas := null;
    new.turma_de := null;
    new.meta_teste_conta := null;
    new.meta_teste_pedido_em := null;
    new.meta_teste_feito_em := null;
    new.meta_teste_ok := null;
    new.meta_teste_detalhe := null;
  else
    new.berry_conferido_em := old.berry_conferido_em;
    new.berry_erro := old.berry_erro;
    new.meta_conferido_em := old.meta_conferido_em;
    new.meta_erro := old.meta_erro;
    new.meta_campanhas := old.meta_campanhas;
    new.turma_de := old.turma_de;
    new.meta_teste_conta := old.meta_teste_conta;
    new.meta_teste_pedido_em := old.meta_teste_pedido_em;
    new.meta_teste_feito_em := old.meta_teste_feito_em;
    new.meta_teste_ok := old.meta_teste_ok;
    new.meta_teste_detalhe := old.meta_teste_detalhe;
    -- O admin trocou a conta ou o filtro: a leitura antiga não vale mais.
    if public.eh_admin() and (
      new.meta_conta_id is distinct from old.meta_conta_id
      or new.meta_filtro is distinct from old.meta_filtro
    ) then
      new.meta_conferido_em := null;
      new.meta_erro := null;
      new.meta_campanhas := null;
    end if;
  end if;
  return new;
end;
$$;
