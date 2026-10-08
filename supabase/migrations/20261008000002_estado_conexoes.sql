-- Estado das puxadas automáticas de cada lançamento, para a tela avisar
-- quando a Berry ou o Meta Ads param de atualizar.
--   *_conferido_em: última vez que a rotina consultou com sucesso (mesmo sem
--                   número novo, caso em que nenhuma foto é gravada).
--   *_erro:         mensagem da última tentativa, se falhou; vazio se deu certo.
alter table public.lancamentos
  add column berry_conferido_em timestamptz,
  add column berry_erro text,
  add column meta_conferido_em timestamptz,
  add column meta_erro text;

-- Só o servidor (as rotinas) escreve nesses campos; ninguém logado altera.
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
  else
    new.berry_conferido_em := old.berry_conferido_em;
    new.berry_erro := old.berry_erro;
    new.meta_conferido_em := old.meta_conferido_em;
    new.meta_erro := old.meta_erro;
  end if;
  return new;
end;
$$;

create trigger proteger_estado_conexoes
  before insert or update on public.lancamentos
  for each row execute function public.proteger_estado_conexoes();

-- Ponto de partida: a última foto automática de cada lançamento.
update public.lancamentos l set
  berry_conferido_em = (
    select max(f.criado_em) from public.fotos_metricas f
    where f.lancamento_id = l.id and f.fonte = 'berry'
  ),
  meta_conferido_em = (
    select max(f.criado_em) from public.fotos_metricas f
    where f.lancamento_id = l.id and f.fonte = 'meta'
  );
