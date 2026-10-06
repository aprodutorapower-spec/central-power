-- Etapa 4: atualização do estrategista (status, bloqueio, próximo passo) e
-- fotos datadas de métricas, que formam o histórico do lançamento.

alter table public.lancamentos
  add column status text check (status in ('verde', 'amarelo', 'vermelho')),
  add column bloqueio text not null default '',
  add column proximo_passo text not null default '',
  add column status_atualizado_em timestamptz,
  add column status_atualizado_por_nome text;

create table public.fotos_metricas (
  id uuid primary key default gen_random_uuid(),
  lancamento_id uuid not null references public.lancamentos (id) on delete cascade,
  data date not null,
  criado_em timestamptz not null default now(),
  preenchido_por uuid references public.perfis (id) on delete set null,
  preenchido_por_nome text,
  -- 'manual' por enquanto; integrações futuras gravam aqui com outra fonte.
  fonte text not null default 'manual',
  verba_investida numeric(14, 2) check (verba_investida >= 0),
  ingressos_vendidos integer check (ingressos_vendidos >= 0),
  receita_ingressos numeric(14, 2) check (receita_ingressos >= 0),
  -- No LP, comp_aula1 guarda o comparecimento do evento.
  comp_aula1 integer check (comp_aula1 >= 0),
  comp_aula2 integer check (comp_aula2 >= 0),
  comp_aula3 integer check (comp_aula3 >= 0),
  comp_aula4 integer check (comp_aula4 >= 0),
  comp_aula5 integer check (comp_aula5 >= 0),
  comp_pitch integer check (comp_pitch >= 0),
  vendas_produto integer check (vendas_produto >= 0),
  faturamento_produto numeric(14, 2) check (faturamento_produto >= 0)
);

create index fotos_metricas_lancamento_idx
  on public.fotos_metricas (lancamento_id, criado_em desc);

alter table public.fotos_metricas enable row level security;
revoke all on public.fotos_metricas from anon;

-- Seguem o lançamento. O histórico não é reescrito: corrigir ou apagar, só admin.
create policy fotos_ver on public.fotos_metricas
  for select to authenticated
  using (public.acessa_lancamento(lancamento_id));

create policy fotos_inserir on public.fotos_metricas
  for insert to authenticated
  with check (public.acessa_lancamento(lancamento_id));

create policy fotos_admin_alterar on public.fotos_metricas
  for update to authenticated
  using (public.eh_admin())
  with check (public.eh_admin());

create policy fotos_admin_apagar on public.fotos_metricas
  for delete to authenticated
  using (public.eh_admin());
