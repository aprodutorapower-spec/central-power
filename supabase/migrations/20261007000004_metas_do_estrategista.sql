-- Nova regra das metas: o estrategista define ao criar o lançamento e pode
-- corrigir enquanto a venda de ingressos não começou. A partir do início das
-- vendas, só o admin altera.

alter table public.lancamentos
  -- Vira verdadeiro na primeira vez em que o estrategista tenta mexer depois
  -- do início das vendas, e não volta: adiar o DV0 não reabre as metas.
  add column metas_travadas boolean not null default false;

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
