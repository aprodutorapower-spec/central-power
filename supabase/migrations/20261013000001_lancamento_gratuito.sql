-- Lançamento gratuito (LG): capta leads de graça para um evento online, em vez
-- de vender ingressos. Usa as mesmas colunas dos pagos com outro significado:
--   meta_ingressos / ingressos_vendidos  -> meta de leads / leads captados
--   meta_cpa                             -> meta de CPL
--   compras_trafego                      -> leads que vieram do tráfego
--   comp_evento                          -> participação ao vivo
-- e ganha uma coluna nova: quantos ficaram até o final do evento.
alter table public.lancamentos drop constraint lancamentos_tipo_check;
alter table public.lancamentos
  add constraint lancamentos_tipo_check check (tipo = any (array['LP', 'LPS', 'LG']));

alter table public.checkpoint_modelos drop constraint checkpoint_modelos_tipo_check;
alter table public.checkpoint_modelos
  add constraint checkpoint_modelos_tipo_check check (tipo = any (array['LP', 'LPS', 'LG']));

alter table public.fotos_metricas
  add column retencao_final integer check (retencao_final >= 0);

-- Modelos de checkpoint do gratuito (o admin edita em "Modelos de checkpoint").
insert into public.checkpoint_modelos (tipo, titulo, dias_do_d0, descricao) values
  ('LG', 'Base do lançamento', -14, 'Oferta e expert validados, datas definidas, página de captura no ar, primeira campanha rodando'),
  ('LG', 'Pré-evento aberto', -7, 'Leads entrando com tráfego otimizado, meta de leads revisada'),
  ('LG', 'Pré-evento pronto', -3, 'Mensageria programada, grupo aquecido, materiais prontos'),
  ('LG', 'Véspera', -1, 'Link do evento testado, comunicação enviada, equipe alinhada'),
  ('LG', 'Evento', 0, 'Evento realizado, participação ao vivo e retenção até o final registradas'),
  ('LG', 'Fechamento do carrinho', 4, 'Carrinho fechado, vendas e faturamento registrados'),
  ('LG', 'Retrospectiva', 7, 'Métricas finais registradas e aprendizados anotados');
