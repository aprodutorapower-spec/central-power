-- Etapa 2: lançamentos de cada expert, com as datas dos marcos.

create table public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.experts (id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('LP', 'LPS')),
  m0 date,
  dv0 date,
  de0 date not null,
  d0 date not null,
  dp0 date,
  dfc date not null,
  meta_ingressos integer check (meta_ingressos >= 0),
  situacao text not null default 'ativo' check (situacao in ('ativo', 'encerrado')),
  criado_por uuid references public.perfis (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  -- DP0 (dia do pitch) só existe no semanal.
  constraint lancamentos_dp0_so_lps check (tipo = 'LPS' or dp0 is null)
);

create index lancamentos_expert_idx on public.lancamentos (expert_id);

alter table public.lancamentos enable row level security;
revoke all on public.lancamentos from anon;

-- Segue a regra do expert: estrategista só nos próprios; admin em todos.
create policy lancamentos_ver on public.lancamentos
  for select to authenticated
  using (public.acessa_expert(expert_id));

create policy lancamentos_inserir on public.lancamentos
  for insert to authenticated
  with check (public.acessa_expert(expert_id));

create policy lancamentos_alterar on public.lancamentos
  for update to authenticated
  using (public.acessa_expert(expert_id))
  with check (public.acessa_expert(expert_id));

create policy lancamentos_admin_apagar on public.lancamentos
  for delete to authenticated
  using (public.eh_admin());
