-- Conexão com a Berry Pay: uma chave de API por expert e, em cada lançamento,
-- o produto que é o ingresso.

create table public.berry_conexoes (
  expert_id uuid primary key references public.experts (id) on delete cascade,
  -- Cifrada pelo servidor do sistema antes de gravar. Nunca volta para a tela.
  chave_cifrada text not null,
  -- Últimos caracteres, só para a pessoa reconhecer qual chave está em uso.
  chave_final text not null,
  conectado_por uuid references public.perfis (id) on delete set null,
  conectado_por_nome text,
  conectado_em timestamptz not null default now()
);

alter table public.berry_conexoes enable row level security;
revoke all on public.berry_conexoes from anon, authenticated;

-- Quem está logado só enxerga a situação da conexão (nunca a chave), e só dos
-- próprios experts. Gravar e ler a chave é serviço do servidor, que confere
-- o acesso ao expert antes.
grant select (expert_id, chave_final, conectado_por_nome, conectado_em)
  on public.berry_conexoes to authenticated;

create policy berry_conexoes_ver on public.berry_conexoes
  for select to authenticated
  using (public.acessa_expert(expert_id));

alter table public.lancamentos
  add column berry_produto_id text,
  add column berry_produto_nome text;
