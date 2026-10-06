-- Comparecimento passa a ser medido pelo número de pessoas no grupo de WhatsApp.
alter table public.fotos_metricas
  add column grupo_whatsapp integer check (grupo_whatsapp >= 0);
