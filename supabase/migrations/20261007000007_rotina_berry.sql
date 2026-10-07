-- Agenda a puxada da Berry três vezes ao dia (9h, 12h e 18h de Brasília).
-- O agendador da Vercel no plano gratuito só roda uma vez por dia, então quem
-- chama a rotina do sistema é o próprio banco.
--
-- O segredo que identifica a chamada NÃO fica neste arquivo: mora no cofre do
-- Supabase (vault) com o nome 'cron_secret', igual ao CRON_SECRET da Vercel.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create or replace function public.chamar_rotina_berry()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  segredo text;
begin
  select decrypted_secret into segredo
  from vault.decrypted_secrets
  where name = 'cron_secret';

  if segredo is null then
    raise warning 'cron_secret não está no cofre: a rotina da Berry não rodou';
    return;
  end if;

  perform net.http_get(
    url := 'https://central-power.vercel.app/api/cron/berry',
    headers := jsonb_build_object('Authorization', 'Bearer ' || segredo),
    timeout_milliseconds := 60000
  );
end;
$$;

revoke execute on function public.chamar_rotina_berry() from public, anon, authenticated;

-- Horários em UTC: 12h, 15h e 21h = 9h, 12h e 18h em Brasília.
select cron.schedule(
  'berry-3x-ao-dia',
  '0 12,15,21 * * *',
  'select public.chamar_rotina_berry()'
);
