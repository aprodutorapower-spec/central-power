-- Vendas que vieram do tráfego pago, para o CAC (verba ÷ vendas do tráfego)
-- e para separar orgânico de tráfego. Por enquanto o número é o de compras
-- que o Meta Ads atribui às campanhas do lançamento; quando a Berry passar a
-- devolver as UTMs na leitura, a origem troca e a coluna continua a mesma.
alter table public.fotos_metricas add column compras_trafego integer;
