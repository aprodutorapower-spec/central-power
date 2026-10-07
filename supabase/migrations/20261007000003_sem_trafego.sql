-- Lançamento sem tráfego pago: fica fora da meta de CPA e não conta como
-- "sem meta". Só o admin marca, como as outras metas.

alter table public.lancamentos
  add column sem_trafego boolean not null default false;

create or replace function public.proteger_metas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Sem usuário logado é o próprio servidor (migrations, rotinas): passa.
  if (select auth.uid()) is null or public.eh_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.meta_ingressos := null;
    new.meta_cpa := null;
    new.inicio_vendas := null;
    new.fim_vendas := null;
    new.sem_trafego := false;
  else
    new.meta_ingressos := old.meta_ingressos;
    new.meta_cpa := old.meta_cpa;
    new.inicio_vendas := old.inicio_vendas;
    new.fim_vendas := old.fim_vendas;
    new.sem_trafego := old.sem_trafego;
  end if;
  return new;
end;
$$;
