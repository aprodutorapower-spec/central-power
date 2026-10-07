# Sistema de Controle de Lançamentos (Power)

## Quem é o usuário
Ricardo, gestor de projetos na Power. Não programa. Explique tudo em português simples, diga exatamente o que ele precisa clicar ou colar, e evite jargão.

## Stack
Next.js (App Router) + TypeScript + Tailwind, Supabase (Auth, Postgres, RLS), deploy na Vercel. Interface em português do Brasil.

## Regras fixas
- Nunca altere ou apague tabelas, dados ou apps que já existam no Supabase ou na Vercel conectados.
- Toda tabela nova tem RLS ativo: estrategista só acessa dados ligados aos próprios experts, admin acessa tudo, sem acesso anônimo.
- Mudanças de banco sempre em migrations versionadas em supabase/migrations.
- Nunca coloque senhas, chaves ou tokens no código ou no git; use variáveis de ambiente.
- Um commit por etapa, com mensagem clara.
- Dados de teste são sempre fictícios e devem ser removidos ao final de cada etapa.
- Interface em português do Brasil, tema escuro com a logo e as cores da Power (logo-power.png na raiz; cores exatas da logo: #FFFFFF e #9B0700).
- Os marcos usam os nomes M0, DV0, DE0, D0, DP0 e DFC, iguais aos do Asana.
- Não implemente nada fora do escopo, mas deixe a estrutura pronta para integrações futuras (a tabela de fotos de métricas tem campo de fonte).
- Pare e pergunte apenas quando precisar de uma credencial que você não consegue obter, houver uma decisão de negócio não coberta ou existir risco para dados existentes.

## Escopo (5 etapas, cada uma publicada para o Ricardo testar)
1. Estrategistas: admin cria o acesso de cada um e liga aos experts. O estrategista também cadastra os próprios experts (pedido do Ricardo em 06/10/2026).
2. Lançamentos: tipo LP ou LPS, marcos calculados a partir do D0 e editáveis, meta de ingressos, ativo/encerrado.
3. Linha do tempo: marcos + checkpoints (modelos editáveis pelo admin), próximo item, dias restantes, cores.
4. Atualização do estrategista: status, bloqueio, próximo passo e foto datada de métricas.
5. Visão geral do admin: modos "Prioridades" e "Por estrategista".
Fluxo de cada etapa: build, lint, tipos, `scripts/isolamento.mjs`, publicar, relatório curto com passo a passo de teste, e esperar o "pode seguir".

## Decisões já tomadas
- Login por e-mail e senha. O admin gera um link de acesso de uso único e envia por fora (WhatsApp); o estrategista entra por ele e cria a senha. Não usamos link mágico por e-mail porque o envio embutido do Supabase só manda uns poucos e-mails por hora.
- O link de acesso só é consumido no clique do botão em /auth/confirmar (prévia de link de aplicativo de mensagem não gasta o link).

## Cuidados aprendidos
- Constante usada pelo servidor e pelo navegador mora em `lib/`, nunca num arquivo "use client": importada de lá numa página do servidor, ela chega vazia e a página quebra (foi o erro 500 da etapa 4). Build, lint e tipos não pegam isso.
- Por isso, antes de dar uma etapa por pronta, abrir as telas num navegador de verdade (Chrome sem janela via puppeteer-core, instalado fora do projeto) com usuários fictícios e clicar nos botões; apagar os dados no final.
- Cores: destaque só no vermelho da logo (`power`); `power-claro` é só para texto pequeno; amarelo e verde só no semáforo (status e prazos). O Ricardo rejeitou o amarelo-alaranjado em selos.
- Sessão: `obterSessao()` faz uma chamada só (`rpc meu_perfil`); o `proxy.ts` lê o cookie sem ida ao servidor de login. Não voltar a usar `auth.getUser()` em toda requisição: deixava os cliques lentos.

## Pendência adiada
Como o Ricardo será avisado e como os estrategistas serão cobrados: em 06/10/2026 ele mandou jogar para frente ("ainda vou mexer no sistema antes de pensar nisso"). Não lembrar disso a cada sessão; só retomar quando ele puxar o assunto.

## Decisões do Ricardo
- LPS tem sempre a mesma estrutura (D0 segunda, pitch D0+6, carrinho fecha D0+8). Está certo como está; não perguntar de novo.
- Status do lançamento é manual por enquanto.
- Comparecimento = pessoas no grupo de WhatsApp, campo visível. Sem bloqueio/próximo passo e sem vendas do produto principal no formulário.

## Conexão com a Berry (07/10/2026)
- Tela em `/experts/[id]/berry`: uma chave de API por expert (`berry_conexoes`) e o produto do ingresso por lançamento (`lancamentos.berry_produto_id` / `berry_produto_nome`). Cada edição da imersão é um produto diferente na Berry, muitas vezes já inativo: produtos inativos continuam na lista.
- A chave é cifrada no servidor com `BERRY_SEGREDO` (em `.env.local` e na Vercel) e nunca volta para a tela; quem está logado só lê a situação da conexão. Gravar e ler a chave é pela chave de serviço, depois de conferir o acesso ao expert (`lib/berry.ts`). Se o `BERRY_SEGREDO` for trocado, as chaves precisam ser coladas de novo.
- API da Berry: `https://api.berrypay.com.br/v1`, documentação em `https://developers.berrypay.com.br/llms-full.txt`. Só usamos leitura (produtos e contagem de vendas pagas). O servidor MCP da Berry não é necessário.
- Por enquanto a tela só mostra a contagem de vendas pagas; ainda não grava fotos de métricas com fonte `berry`.

## Próximos passos (fora do v1)
Pauta automática da call de sexta, integrações (Meta Ads por BM em modo leitura, Berry Pay preenchendo as métricas sozinha, Asana), lançamentos perpétuos, teste de aceite com os estrategistas, domínio próprio.

## Estado do projeto
- Repositório `aprodutorapower-spec/central-power`, projeto Vercel `central-power`, Supabase `pruntjhpcucfiudcdtpb`.
- A Central Power antiga (página única) ficou guardada em `public/legado.html`. As tabelas dela (`clients`, `tasks`, `sprints`, `daily_updates`, `client_kpis`) são legado: não mexer.
- Tabelas novas têm nome em português (`perfis`, `experts`, `lancamentos`, `checkpoint_modelos`, `checkpoints`, `fotos_metricas`). `perfis.id` é próprio; o vínculo com o login é `perfis.user_id`.
- Banco: o Ricardo autorizou (06/10/2026) aplicar as migrations deste projeto direto, pela API de gestão do Supabase (`POST /v1/projects/pruntjhpcucfiudcdtpb/database/query`, token em `~/.config/supabase-power/token`). Aplicar cada arquivo de `supabase/migrations` dentro de `begin; ... commit;`.
- Login: cadastro público desligado no Supabase; usuários só nascem pela tela Estrategistas. Link de acesso vale 24h.
- A Vercel NÃO está ligada ao GitHub (a conta GitHub da Vercel é outra). Publicar ao fim de cada etapa com `npx vercel deploy --prod --yes` (Node em `~/.nvm/versions/node/v24.16.0/bin`), depois do commit + push.
- Next 16: o antigo `middleware.ts` chama-se `proxy.ts`. Ver AGENTS.md.

@AGENTS.md
