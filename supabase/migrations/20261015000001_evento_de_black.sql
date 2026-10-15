-- Evento de Black (BLACK): reativa quem já comprou ou participou de algo com o
-- expert, por disparos para grupos e listas antigas, e vende o produto
-- principal numa live. A meta principal é a entrada de gente no grupo.
-- Usa as mesmas colunas, com outro significado:
--   meta_ingressos / ingressos_vendidos -> meta de pessoas no grupo / pessoas no grupo
--   meta_cpa                            -> meta de CPL (quando há tráfego pago)
--   comp_evento                         -> comparecimento na live
--   faturamento_produto                 -> faturamento do produto principal
-- e ganha uma coluna nova: quantas pessoas foram convidadas (disparos feitos).
alter table public.lancamentos drop constraint lancamentos_tipo_check;
alter table public.lancamentos
  add constraint lancamentos_tipo_check check (tipo = any (array['LP', 'LPS', 'LG', 'BLACK']));

alter table public.checkpoint_modelos drop constraint checkpoint_modelos_tipo_check;
alter table public.checkpoint_modelos
  add constraint checkpoint_modelos_tipo_check check (tipo = any (array['LP', 'LPS', 'LG', 'BLACK']));

alter table public.fotos_metricas
  add column disparos integer check (disparos >= 0);

-- Modelos de checkpoint do evento de Black (o admin edita em "Modelos de checkpoint").
insert into public.checkpoint_modelos (tipo, titulo, dias_do_d0, descricao) values
  ('BLACK', 'Base do evento', -14, 'Oferta de Black definida, listas e grupos antigos separados para os disparos, link e checkout prontos'),
  ('BLACK', 'Disparos em andamento', -7, 'Disparos rodando para as bases antigas, gente entrando no grupo, meta de entrada revisada'),
  ('BLACK', 'Pré-evento pronto', -3, 'Mensageria do grupo programada, materiais da live prontos'),
  ('BLACK', 'Véspera', -1, 'Link da live testado, lembretes enviados, oferta configurada no checkout'),
  ('BLACK', 'Live de Black', 0, 'Live realizada, comparecimento registrado'),
  ('BLACK', 'Fechamento do carrinho', 4, 'Carrinho fechado, faturamento registrado'),
  ('BLACK', 'Retrospectiva', 7, 'Métricas finais registradas e aprendizados anotados');
