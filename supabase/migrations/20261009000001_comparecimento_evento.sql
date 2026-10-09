-- Comparecimento no evento (pedido dos estrategistas na call de 09/10/2026).
-- No LPS já existem comp_aula1..5 e comp_pitch; o LP, de evento único, ganha
-- a sua coluna. O grupo de WhatsApp continua sendo um número à parte.
alter table public.fotos_metricas add column comp_evento integer;
