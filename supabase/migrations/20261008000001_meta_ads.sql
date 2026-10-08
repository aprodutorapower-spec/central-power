-- Verba do Meta Ads por lançamento. Uma rotina agendada consulta o Meta e
-- entrega os gastos das campanhas; o sistema soma as que batem com o filtro.
--   meta_conta_id: número da conta de anúncios.
--   meta_filtro:   palavras que o nome da campanha precisa ter (separadas por
--                  vírgula), por exemplo "Vendas, 31/10 - LCTO".
--   meta_desde:    conta a verba a partir deste dia (em branco: início das vendas).
alter table public.lancamentos
  add column meta_conta_id text,
  add column meta_filtro text,
  add column meta_desde date;

-- Só o admin (ou o próprio servidor) define de onde vem a verba.
create or replace function public.proteger_meta_ads()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or public.eh_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.meta_conta_id := null;
    new.meta_filtro := null;
    new.meta_desde := null;
  else
    new.meta_conta_id := old.meta_conta_id;
    new.meta_filtro := old.meta_filtro;
    new.meta_desde := old.meta_desde;
  end if;
  return new;
end;
$$;

create trigger proteger_meta_ads
  before insert or update on public.lancamentos
  for each row execute function public.proteger_meta_ads();
