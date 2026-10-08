-- Vigia das atualizações automáticas e avisos no Asana.
--   rotinas: quando cada rotina rodou pela última vez (berry, meta, avisos).
--   avisos:  problemas em aberto; `avisado_em` marca os que já viraram tarefa
--            no Asana, para não repetir. Problema resolvido sai da tabela.
--   lancamentos.meta_campanhas: quantas campanhas entraram na última soma.
alter table public.lancamentos add column meta_campanhas integer;

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
  else
    new.berry_conferido_em := old.berry_conferido_em;
    new.berry_erro := old.berry_erro;
    new.meta_conferido_em := old.meta_conferido_em;
    new.meta_erro := old.meta_erro;
    new.meta_campanhas := old.meta_campanhas;
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

create table public.rotinas (
  nome text primary key,
  ultima_execucao timestamptz not null default now()
);

create table public.avisos (
  chave text primary key,
  lancamento_id uuid references public.lancamentos(id) on delete cascade,
  titulo text not null,
  detalhe text not null,
  aberto_em timestamptz not null default now(),
  avisado_em timestamptz
);

-- Só o servidor escreve; o admin lê; estrategista e anônimo não enxergam.
alter table public.rotinas enable row level security;
alter table public.avisos enable row level security;
revoke all on public.rotinas, public.avisos from anon, authenticated;
grant select on public.rotinas, public.avisos to authenticated;

create policy rotinas_admin_ver on public.rotinas
  for select to authenticated using (public.eh_admin());
create policy avisos_admin_ver on public.avisos
  for select to authenticated using (public.eh_admin());

-- Ponto de partida: a última vez que cada rotina deixou rastro.
insert into public.rotinas (nome, ultima_execucao)
select 'berry', max(berry_conferido_em) from public.lancamentos
having max(berry_conferido_em) is not null;
insert into public.rotinas (nome, ultima_execucao)
select 'meta', max(meta_conferido_em) from public.lancamentos
having max(meta_conferido_em) is not null;
