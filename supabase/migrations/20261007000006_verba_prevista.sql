-- Verba total prevista para o lançamento (quanto será investido ao todo), para
-- comparar com o que já foi investido. Segue a mesma trava das metas.

alter table public.lancamentos
  add column verba_prevista numeric(14, 2) check (verba_prevista >= 0);

create or replace function public.proteger_metas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  -- Sem usuário logado é o próprio servidor (migrations, rotinas): passa.
  if (select auth.uid()) is null or public.eh_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Na criação o estrategista define as metas livremente.
    new.metas_travadas := false;
    return new;
  end if;

  if old.metas_travadas
     or hoje >= coalesce(old.inicio_vendas, old.dv0, old.de0) then
    new.meta_ingressos := old.meta_ingressos;
    new.meta_cpa := old.meta_cpa;
    new.ticket_ingresso := old.ticket_ingresso;
    new.verba_prevista := old.verba_prevista;
    new.inicio_vendas := old.inicio_vendas;
    new.fim_vendas := old.fim_vendas;
    new.sem_trafego := old.sem_trafego;
    new.metas_travadas := true;
  else
    new.metas_travadas := false;
  end if;
  return new;
end;
$$;
