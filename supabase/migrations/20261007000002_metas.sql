-- Metas do lançamento, definidas só pelo admin: meta de ingressos (já existia),
-- meta de CPA e a janela de venda de ingressos.

alter table public.lancamentos
  add column meta_cpa numeric(14, 2) check (meta_cpa > 0),
  -- Em branco, a janela vai do DV0 (ou DE0, se não houver DV0) ao D0.
  add column inicio_vendas date,
  add column fim_vendas date;

-- O estrategista continua editando o próprio lançamento, mas as metas ficam
-- como o admin deixou: o que ele mandar nesses campos é ignorado.
create function public.proteger_metas()
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
  else
    new.meta_ingressos := old.meta_ingressos;
    new.meta_cpa := old.meta_cpa;
    new.inicio_vendas := old.inicio_vendas;
    new.fim_vendas := old.fim_vendas;
  end if;
  return new;
end;
$$;

create trigger lancamentos_proteger_metas
  before insert or update on public.lancamentos
  for each row execute function public.proteger_metas();

revoke execute on function public.proteger_metas() from public, anon, authenticated;
