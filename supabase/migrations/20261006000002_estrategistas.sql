-- Etapa 1 (escopo novo): o perfil do estrategista passa a existir antes do
-- acesso dele, e cada expert tem um único estrategista responsável.
-- Mexe só nas tabelas criadas na migration anterior.

-- perfis: desacopla do usuário do Auth.
alter table public.perfis drop constraint perfis_id_fkey;
alter table public.perfis alter column id set default gen_random_uuid();
alter table public.perfis
  add column user_id uuid unique references auth.users (id) on delete set null;
update public.perfis set user_id = id;
alter table public.perfis alter column email drop not null;
create unique index perfis_email_idx on public.perfis (lower(email));

-- experts: responsável único no lugar da tabela de vínculos.
alter table public.experts
  add column estrategista_id uuid references public.perfis (id) on delete set null;
create index experts_estrategista_idx on public.experts (estrategista_id);

create or replace function public.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis
    where user_id = (select auth.uid()) and papel = 'admin' and ativo
  );
$$;

create function public.meu_perfil_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.perfis
  where user_id = (select auth.uid()) and ativo;
$$;

create or replace function public.acessa_expert(p_expert_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.eh_admin() or exists (
    select 1 from public.experts e
    where e.id = p_expert_id
      and e.estrategista_id = public.meu_perfil_id()
  );
$$;

revoke execute on function public.meu_perfil_id() from public, anon;
grant execute on function public.meu_perfil_id() to authenticated;

drop table public.expert_estrategistas;

-- perfis: cada um vê o próprio; admin vê e gerencia todos.
drop policy perfis_ver on public.perfis;
create policy perfis_ver on public.perfis
  for select to authenticated
  using (user_id = (select auth.uid()) or public.eh_admin());

-- experts: o estrategista vê, cria e edita só os próprios; admin, todos.
drop policy experts_ver on public.experts;
drop policy experts_admin_inserir on public.experts;
drop policy experts_admin_alterar on public.experts;

create policy experts_ver on public.experts
  for select to authenticated
  using (public.eh_admin() or estrategista_id = public.meu_perfil_id());

create policy experts_inserir on public.experts
  for insert to authenticated
  with check (public.eh_admin() or estrategista_id = public.meu_perfil_id());

create policy experts_alterar on public.experts
  for update to authenticated
  using (public.eh_admin() or estrategista_id = public.meu_perfil_id())
  with check (public.eh_admin() or estrategista_id = public.meu_perfil_id());

-- Estrategistas iniciais, ainda sem acesso (o admin gera o link de cada um).
insert into public.perfis (nome, papel) values
  ('Marco', 'estrategista'),
  ('Haron', 'estrategista'),
  ('Vitor', 'estrategista'),
  ('Alexandre', 'estrategista'),
  ('Henrique', 'estrategista'),
  ('Eduardo', 'estrategista');
