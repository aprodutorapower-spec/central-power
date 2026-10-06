-- Etapa 1: base de acesso (perfis, experts e vínculo estrategista x expert).
-- Só cria objetos novos. Não toca nas tabelas da Central antiga.

create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  email text not null,
  papel text not null default 'estrategista' check (papel in ('admin', 'estrategista')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table public.experts (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table public.expert_estrategistas (
  expert_id uuid not null references public.experts (id) on delete cascade,
  estrategista_id uuid not null references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (expert_id, estrategista_id)
);

create index expert_estrategistas_estrategista_idx
  on public.expert_estrategistas (estrategista_id);

-- Funções de apoio às regras de acesso. Rodam como dono para não entrar em
-- laço com as próprias políticas das tabelas que consultam.
create function public.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis
    where id = (select auth.uid()) and papel = 'admin' and ativo
  );
$$;

create function public.acessa_expert(p_expert_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.eh_admin() or exists (
    select 1
    from public.expert_estrategistas ee
    join public.perfis p on p.id = ee.estrategista_id
    where ee.expert_id = p_expert_id
      and ee.estrategista_id = (select auth.uid())
      and p.ativo
  );
$$;

revoke execute on function public.eh_admin() from public, anon;
revoke execute on function public.acessa_expert(uuid) from public, anon;
grant execute on function public.eh_admin() to authenticated;
grant execute on function public.acessa_expert(uuid) to authenticated;

alter table public.perfis enable row level security;
alter table public.experts enable row level security;
alter table public.expert_estrategistas enable row level security;

revoke all on public.perfis, public.experts, public.expert_estrategistas from anon;

-- perfis: cada um vê o próprio; admin vê e gerencia todos.
create policy perfis_ver on public.perfis
  for select to authenticated
  using (id = (select auth.uid()) or public.eh_admin());

create policy perfis_admin_inserir on public.perfis
  for insert to authenticated
  with check (public.eh_admin());

create policy perfis_admin_alterar on public.perfis
  for update to authenticated
  using (public.eh_admin())
  with check (public.eh_admin());

create policy perfis_admin_apagar on public.perfis
  for delete to authenticated
  using (public.eh_admin());

-- experts: estrategista só vê os seus; admin vê e gerencia todos.
create policy experts_ver on public.experts
  for select to authenticated
  using (public.acessa_expert(id));

create policy experts_admin_inserir on public.experts
  for insert to authenticated
  with check (public.eh_admin());

create policy experts_admin_alterar on public.experts
  for update to authenticated
  using (public.eh_admin())
  with check (public.eh_admin());

create policy experts_admin_apagar on public.experts
  for delete to authenticated
  using (public.eh_admin());

-- vínculos: estrategista vê os próprios; só admin cria ou remove.
create policy vinculos_ver on public.expert_estrategistas
  for select to authenticated
  using (estrategista_id = (select auth.uid()) or public.eh_admin());

create policy vinculos_admin_inserir on public.expert_estrategistas
  for insert to authenticated
  with check (public.eh_admin());

create policy vinculos_admin_apagar on public.expert_estrategistas
  for delete to authenticated
  using (public.eh_admin());
