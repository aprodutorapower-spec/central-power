-- Etapa 3: modelos de checkpoint (por tipo) e checkpoints de cada lançamento.

create table public.checkpoint_modelos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('LP', 'LPS')),
  titulo text not null,
  -- Prazo em dias a partir do D0 (negativo = antes do D0).
  dias_do_d0 integer not null,
  descricao text not null default '',
  criado_em timestamptz not null default now()
);

create table public.checkpoints (
  id uuid primary key default gen_random_uuid(),
  lancamento_id uuid not null references public.lancamentos (id) on delete cascade,
  titulo text not null,
  descricao text not null default '',
  data date not null,
  -- "Atrasado" não é gravado: é data vencida com estado pendente.
  estado text not null default 'pendente'
    check (estado in ('pendente', 'feito', 'nao_se_aplica')),
  feito_em timestamptz,
  feito_por uuid references public.perfis (id) on delete set null,
  -- Nome copiado porque o estrategista não lê o perfil de outras pessoas.
  feito_por_nome text,
  criado_em timestamptz not null default now()
);

create index checkpoints_lancamento_idx on public.checkpoints (lancamento_id);

create function public.acessa_lancamento(p_lancamento_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.lancamentos l
    where l.id = p_lancamento_id and public.acessa_expert(l.expert_id)
  );
$$;

revoke execute on function public.acessa_lancamento(uuid) from public, anon;
grant execute on function public.acessa_lancamento(uuid) to authenticated;

alter table public.checkpoint_modelos enable row level security;
alter table public.checkpoints enable row level security;
revoke all on public.checkpoint_modelos, public.checkpoints from anon;

-- Modelos: só o admin lê e edita (os checkpoints são gerados pelo banco).
create policy modelos_admin on public.checkpoint_modelos
  for all to authenticated
  using (public.eh_admin())
  with check (public.eh_admin());

-- Checkpoints: seguem o lançamento. Criar e apagar, só o admin.
create policy checkpoints_ver on public.checkpoints
  for select to authenticated
  using (public.acessa_lancamento(lancamento_id));

create policy checkpoints_alterar on public.checkpoints
  for update to authenticated
  using (public.acessa_lancamento(lancamento_id))
  with check (public.acessa_lancamento(lancamento_id));

create policy checkpoints_admin_inserir on public.checkpoints
  for insert to authenticated
  with check (public.eh_admin());

create policy checkpoints_admin_apagar on public.checkpoints
  for delete to authenticated
  using (public.eh_admin());

-- Ao criar um lançamento, gera os checkpoints do tipo dele a partir do D0.
create function public.gerar_checkpoints()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.checkpoints (lancamento_id, titulo, descricao, data)
  select new.id, m.titulo, m.descricao, new.d0 + m.dias_do_d0
  from public.checkpoint_modelos m
  where m.tipo = new.tipo;
  return new;
end;
$$;

create trigger lancamentos_gerar_checkpoints
  after insert on public.lancamentos
  for each row execute function public.gerar_checkpoints();

-- Se o D0 mudar, os checkpoints ainda pendentes andam junto.
create function public.acompanhar_d0()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.checkpoints
  set data = data + (new.d0 - old.d0)
  where lancamento_id = new.id and estado = 'pendente';
  return new;
end;
$$;

create trigger lancamentos_acompanhar_d0
  after update of d0 on public.lancamentos
  for each row when (old.d0 is distinct from new.d0)
  execute function public.acompanhar_d0();

revoke execute on function public.gerar_checkpoints() from public, anon, authenticated;
revoke execute on function public.acompanhar_d0() from public, anon, authenticated;

insert into public.checkpoint_modelos (tipo, titulo, dias_do_d0, descricao) values
  ('LPS', 'Base do lançamento', -14, 'Oferta e expert validados, datas definidas, páginas de ingresso no ar, primeira campanha rodando'),
  ('LPS', 'Pré-evento aberto', -7, 'Ingressos em venda com tráfego otimizado, criativos em rotação, meta de ingressos revisada'),
  ('LPS', 'Pré-evento pronto', -3, 'Mensageria programada, disparos 1-1 de lembrete agendados, responsáveis por encerrar cada transmissão definidos, materiais da próxima turma prontos'),
  ('LPS', 'Véspera', -1, 'Links das aulas testados, comunicação de abertura enviada, suporte e CS alinhados'),
  ('LPS', 'Aula 1', 0, 'Aula 1 realizada, comparecimento registrado'),
  ('LPS', 'Ficha de interesse', 1, 'Ficha de interesse criada'),
  ('LPS', 'Pré-pitch', 4, 'Script comercial pronto, onboarding e entrega alinhados com CS, planejamento pós-evento nas redes'),
  ('LPS', 'Pitch', 6, 'Pitch realizado e carrinho aberto'),
  ('LPS', 'Fechamento do carrinho', 8, 'Carrinho fechado, vendas e faturamento registrados'),
  ('LPS', 'Retrospectiva', 11, 'Métricas finais registradas e aprendizados anotados'),
  ('LP', 'Base do lançamento', -14, 'Oferta e expert validados, datas definidas, páginas no ar, primeira campanha rodando'),
  ('LP', 'Pré-evento aberto', -7, 'Ingressos em venda com tráfego otimizado, meta revisada'),
  ('LP', 'Pré-evento pronto', -3, 'Mensageria programada, materiais prontos'),
  ('LP', 'Véspera', -1, 'Links testados, comunicação enviada, equipe alinhada'),
  ('LP', 'Evento', 0, 'Evento realizado, comparecimento registrado'),
  ('LP', 'Fechamento do carrinho', 4, 'Carrinho fechado, vendas e faturamento registrados'),
  ('LP', 'Retrospectiva', 7, 'Métricas finais registradas e aprendizados anotados');

-- Lançamentos que já existiam recebem os checkpoints agora.
insert into public.checkpoints (lancamento_id, titulo, descricao, data)
select l.id, m.titulo, m.descricao, l.d0 + m.dias_do_d0
from public.lancamentos l
join public.checkpoint_modelos m on m.tipo = l.tipo;
