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
- Login por e-mail e senha. O admin gera um link de acesso de uso único e envia por fora (WhatsApp); o estrategista abre o link, cria a senha ali mesmo (`/auth/confirmar`), é levado ao login para entrar com e-mail e senha e cai em `/experts` (fluxo pedido pelo Ricardo em 08/10/2026, depois que o Alan abriu o link, não criou a senha e ficou trancado fora). Não usamos link mágico por e-mail porque o envio embutido do Supabase só manda uns poucos e-mails por hora.
- O link de acesso só é consumido quando a senha é salva em /auth/confirmar (abrir o link, ou a prévia do aplicativo de mensagem, não gasta o link).

## Cuidados aprendidos
- Constante usada pelo servidor e pelo navegador mora em `lib/`, nunca num arquivo "use client": importada de lá numa página do servidor, ela chega vazia e a página quebra (foi o erro 500 da etapa 4). Build, lint e tipos não pegam isso.
- Por isso, antes de dar uma etapa por pronta, abrir as telas num navegador de verdade (Chrome sem janela via puppeteer-core, instalado fora do projeto) com usuários fictícios e clicar nos botões; apagar os dados no final.
- Cores: destaque só no vermelho da logo (`power`); `power-claro` é só para texto pequeno; amarelo e verde só no semáforo (status e prazos). O Ricardo rejeitou o amarelo-alaranjado em selos.
- Cartão do lançamento (Ricardo, 07/10/2026): ele achou as informações soltas e pediu algo mais enxuto e padronizado. Ficou em oito blocos iguais (`Bloco` em `visao-estrategista.tsx`), sem os mini gráficos de tendência, que ele mandou tirar; a barra de ingressos ficou. Informação nova no cartão entra como bloco, não solta.
- Estrategistas (Ricardo, 07/10/2026): o cargo tem rotatividade alta. A tela tem "Adicionar" (cria o perfil pendente) e "Excluir estrategista" com confirmação: apaga o perfil e o login; experts e lançamentos ficam "Sem responsável" (a chave estrangeira zera sozinha) e o nome fica no histórico.
- Visão geral enxuta (Ricardo, 07/10/2026): ele achou que tinha informação demais. O "Onde começar" mostra só os problemas (sem a contagem de lançamentos ativos) e o bloco "Operação" com os totais saiu; "por enquanto essa informação não é relevante". Não recolocar totais gerais sem ele pedir. Ele aprovou o "Onde começar", o "Precisam de atenção" e o "Sem nada abaixo da meta" como estão.
- Layout (pedidos do Ricardo em 07/10/2026): telas estreitas, como formulários, ficam centralizadas na página (`mx-auto max-w-2xl` em volta de tudo, inclusive título), nunca encostadas à esquerda; detalhes abrem em pop-up retangular no meio da tela, com o fundo travado; cada data de marco tem um "?" com a explicação (`EXPLICACOES` em `lib/marcos.ts`, peça `Dica` em `interacoes.tsx`).
- Tela de Experts do admin (Ricardo, 08/10/2026): ele achou feio cartões de tamanhos diferentes e rejeitou também cartões de tamanho igual com espaço vazio ("só pode estar de sacanagem"). Ficou uma lista única centralizada (`max-w-3xl`), linhas todas iguais, cada estrategista como título de faixa; quem não tem expert vai para a faixa "Estrategistas sem experts" no fim. Conteúdo de quantidade variável vai em lista, não em grade de cartões.
- Sessão: `obterSessao()` faz uma chamada só (`rpc meu_perfil`); o `proxy.ts` lê o cookie sem ida ao servidor de login. Não voltar a usar `auth.getUser()` em toda requisição: deixava os cliques lentos.

- A pasta do projeto fica na Mesa, sincronizada com o iCloud, que às vezes cria cópias com " 2" no nome dentro de `.git` e `.next`. Sintomas: `git fetch` falha com "bad object refs/heads/main 2", ou o `tsc` reclama de `routes.d 2.ts`. Solução: tirar as cópias de `.git` (guardando-as) e apagar a `.next` antes de compilar.
- No teste de navegador: abrir formulário com `waitUntil: "networkidle0"` antes de digitar (digitando antes de a página ficar pronta, o texto some); o tipo do lançamento é um rádio escondido (clicar por `evaluate`).
- No teste de navegador: o primeiro botão de enviar de toda página é o "Sair" do topo (usar seletor do formulário certo), e para substituir o texto de um campo o clique triplo é `{ count: 3 }`.

## Pendência adiada
Como o Ricardo será avisado e como os estrategistas serão cobrados: em 06/10/2026 ele mandou jogar para frente; em 07/10/2026 confirmou que entra em pauta depois da entrega da visão em dois níveis. Continua como primeiro item de "Próximos passos" no README. Não lembrar disso a cada sessão.

## Decisões do Ricardo
- LPS tem sempre a mesma estrutura (D0 segunda, pitch D0+6, carrinho fecha D0+8). Está certo como está; não perguntar de novo.
- Status do lançamento é manual por enquanto.
- Comparecimento = pessoas no grupo de WhatsApp, campo visível. Sem bloqueio/próximo passo e sem vendas do produto principal no formulário.

## Visão em dois níveis (entrega em andamento, 07/10/2026)
Pedido do Ricardo: reconstruir a experiência do admin em Nível 1 (macro, 6 estrategistas do pior para o melhor) e Nível 2 (todos os lançamentos ativos de um estrategista numa tela, com "Copiar cobrança" e painel lateral da linha do tempo). Três etapas, cada uma publicada e com pausa para o "pode seguir".
- **Etapa A (feita):** metas por lançamento (`meta_ingressos`, `meta_cpa`, `fim_vendas`, `sem_trafego`). Regra atual (Ricardo, 07/10/2026, substitui o "só admin" do pedido original): o estrategista preenche ao criar (obrigatório) e corrige até o início das vendas; a partir do DV0 só o admin altera. O gatilho `proteger_metas` aplica isso no banco e marca `metas_travadas` para adiar o DV0 não reabrir. A parte "corrige até o início das vendas" foi interpretação minha de "após o início dele somente os admins"; se ele disser que é só na criação, basta travar todo UPDATE de não-admin; cálculo de urgência em `lib/urgencia.ts` com testes (`npm test`, roda no Node puro, por isso os imports com `.ts`); auditoria em `docs/auditoria-ux.md`; bloco "Sem meta definida" na visão geral.
- **Etapa B (feita):** Nível 1 em `app/(painel)/visao-geral.tsx`, no lugar da visão geral antiga (`lib/visao.ts` e os filtros saíram). `lib/painel.ts` monta tudo a partir de 4 consultas (`dados-painel.ts`) e é testado com cenários fictícios. Urgência do estrategista = a do pior lançamento dele. Já existe uma versão simples do Nível 2 em `/estrategistas/[id]` (só admin), para o clique ter destino.
- Marcação `sem_trafego` (pedido do Ricardo: a Black Friday da Jessye não tem tráfego pago): só admin marca; o lançamento sai da cobrança de CPA e da lista "sem meta". Lançamento sem métricas cujas vendas ainda não começaram fica "Vendas não começaram", sem alarme.
- **Etapa C (feita):** Nível 2 em `app/(painel)/visao-estrategista.tsx`, usado em `/estrategistas/[id]` (admin) e em `/` para o estrategista ("Meus lançamentos", sem botão de cobrança). Texto da cobrança em `lib/cobranca.ts` (testado). Peças de navegador em `app/(painel)/interacoes.tsx`: menu com página atual, janela da linha do tempo (`<dialog>` dentro do cartão; o Ricardo rejeitou o painel deslizando pela lateral e pediu um pop-up retangular no meio da tela), copiar, e voltar mantendo a rolagem (guardada no `sessionStorage`, porque marcar um checkpoint recarrega os dados e o navegador sozinho perderia a posição).
- Com o `loading.tsx`, a navegação por clique mostra primeiro um esqueleto: no teste de navegador, esperar `main h1` depois de clicar num link.
- Regra: toda tela usa `calcularUrgencia`; nenhuma recalcula status ou ordem. Pesos e `TOLERANCIA_META` ficam nomeados no topo de `lib/urgencia.ts`.
- Formulário de lançamento (pedido do Ricardo, 07/10/2026): sem campo de DE0 (o sistema usa D0-7 na criação e depois só desloca junto com o D0; lançamentos antigos têm DE0 próprio, que é preservado) e sem campo "início das vendas" nas metas, porque duplicava o DV0. A coluna `inicio_vendas` continua no banco, vazia, e a conta ainda a respeita se um dia for preenchida.
- Réguas de mercado (Ricardo, 07/10/2026), em `lib/urgencia.ts`: grupo de WhatsApp com pelo menos 95% dos ingressos vendidos (`MINIMO_GRUPO_WHATSAPP`) e CPA de no máximo o dobro do ticket do ingresso (`MULTIPLO_TETO_CPA`). Confirmado por ele: (1) grupo abaixo de 95% é critério principal, coloca o lançamento em "Abaixo da meta" ("o lançamento precisa estar redondinho"); sem o número do grupo, não pune. (2) Meta de CPA não é obrigatória; quando cadastrada, é a única regra (o dobro do ticket não entra); em branco, vale o dobro do ticket, sem a margem de 10%.
- Ticket e verba prevista (Ricardo, 08/10/2026, substitui o "obrigatórios" de 07/10): o ticket do ingresso saiu do cadastro; a régua do CPA usa o ticket médio real da última foto (receita ÷ ingressos, que a Berry preenche), e a coluna `ticket_ingresso` só vale como reserva em lançamentos antigos sem receita. Antes da primeira venda não há teto de CPA e isso não é pendência: "Sem meta definida" cobra só a meta de ingressos. `verba_prevista` é opcional e só informativa (não entra na urgência). Para o estrategista, obrigatória ao criar é só a meta de ingressos.
- Depois de criar ou trocar a senha, o estrategista cai em `/experts` com um aviso (Ricardo, 08/10/2026); o admin continua em `/conta`.
- Decisões do Ricardo nesta entrega: janela de vendas começa no DV0 (DE0 se não houver) e vai até o D0; "bloqueio" fica fora da urgência (o campo saiu do formulário); dados fictícios de teste no banco continuam permitidos, desde que apagados no fim; avisos e cobrança automática entram em pauta só depois desta entrega.
- A fonte Syne desenha o zero como "o": o `font-variant-numeric: lining-nums` no `globals.css` é o que mantém "D0" legível. Não tirar.

## Conexão com a Berry (07/10/2026)
- Tela em `/experts/[id]/berry`: uma chave de API por expert (`berry_conexoes`) e o produto do ingresso por lançamento (`lancamentos.berry_produto_id` / `berry_produto_nome`). Cada edição da imersão é um produto diferente na Berry, muitas vezes já inativo: produtos inativos continuam na lista.
- A chave é cifrada no servidor com `BERRY_SEGREDO` (em `.env.local` e na Vercel) e nunca volta para a tela; quem está logado só lê a situação da conexão. Gravar e ler a chave é pela chave de serviço, depois de conferir o acesso ao expert (`lib/berry.ts`). Se o `BERRY_SEGREDO` for trocado, as chaves precisam ser coladas de novo.
- API da Berry: `https://api.berrypay.com.br/v1`, documentação em `https://developers.berrypay.com.br/llms-full.txt`. Só usamos leitura (produtos e contagem de vendas pagas). O servidor MCP da Berry não é necessário.
- Puxada automática (07/10/2026): `lib/berry-sincronia.ts` grava foto de métricas com fonte `berry` (ingressos e receita da Berry; verba e grupo copiados da última foto; não grava se nada mudou). Dispara pela rotina `/api/cron/berry` (protegida por `CRON_SECRET`, agendada no próprio banco com `pg_cron` + `pg_net`, tarefa `berry-3x-ao-dia`, para 12h, 15h e 21h UTC = 9h, 12h e 18h de Brasília, porque a Vercel no plano gratuito só aceita rotina diária; o segredo fica no cofre do Supabase com o nome `cron_secret` e precisa ser igual ao `CRON_SECRET` da Vercel; o `proxy.ts` libera `/api/cron`), pelo botão "Atualizar pela Berry agora", ao escolher o produto e ao salvar a atualização. Receita = subtotal menos desconto das compras pagas que contêm o ingresso, ou seja, ingresso + order bumps (confirmado pelo Ricardo em 07/10/2026; ele reforçou que isso vale também para o ticket médio = receita ÷ ingressos). No lançamento do Hermano: 201 ingressos, R$ 6.647,51 com bumps (só o ingresso seria R$ 3.929,90).
- Verba pelo Meta Ads (08/10/2026): o Ricardo tentou criar o token de usuário de sistema, esbarrou no cadastro de desenvolvedor do Meta e mandou seguir com a rotina agendada do Claude. O site NÃO tem token do Meta. Uma rotina na nuvem do Claude (`https://claude.ai/code/routines`, nome "Central Power: verba do Meta Ads", 12h10, 15h10 e 21h10 UTC, dez minutos depois da Berry) usa o conector Meta Ads da conta dele: faz GET em `/api/cron/meta` (lista conta, filtro e período de cada lançamento ativo), consulta as campanhas e faz POST com nome e gasto de cada uma. Quem filtra e soma é o servidor (`lib/meta.ts`, testado; grava foto com fonte `meta` em `lib/meta-sincronia.ts`; não grava zero nem foto repetida). A porta usa o segredo `META_ROTINA_SEGREDO` (`.env.local`, Vercel e o texto da rotina; se trocar, trocar nos três).
- Por lançamento, só o admin define (formulário de edição; o gatilho `proteger_meta_ads` trava no banco): `meta_conta_id`, `meta_filtro` (palavras separadas por vírgula que o nome da campanha precisa ter, ex.: "Vendas, 31/10 - LCTO") e `meta_desde` (em branco: início das vendas). A regra saiu do relatório do gestor da Vivian: só campanhas de venda com a etiqueta do lançamento; posts impulsionados, campanhas de visualização e outros produtos ficam de fora. Contas que o conector marca como não habilitadas (ex.: "ME - Dr. Hermano Castro") não podem ser lidas pela rotina.

## Regra: toda conexão é contínua (Ricardo, 08/10/2026)
- Berry e Meta Ads nunca são ligados para puxar uma vez só: tudo que for conectado entra na rotina de 3 vezes ao dia. Puxada única só em caso retroativo, "a exceção da exceção", e só se ele pedir.
- Hoje isso vale por construção: as duas rotinas não têm lista própria, percorrem todo lançamento com `situacao = 'ativo'` que tenha a conexão preenchida (`sincronizarTodos` em `lib/berry-sincronia.ts`; `lancamentosDoMeta` em `lib/meta-sincronia.ts`). Encerrar o lançamento é o que desliga; outro lançamento ativo do mesmo expert continua sendo puxado, porque o filtro é por lançamento.
- Ao criar qualquer integração nova, seguir o mesmo desenho: nada de botão ou script que grave dados sem o lançamento entrar na rotina.
- Ao ligar a Berry ou o Meta de um lançamento, conferir na execução seguinte que ele apareceu na rotina (resposta em `net._http_response` para a Berry; foto com fonte `meta` para o Meta).

- Aviso de conexão (aprovado pelo Ricardo em 08/10/2026): o cartão do lançamento mostra a faixa "Atualização automática com problema" só quando há algo errado (Berry ou Meta Ads não conectado, com erro, ou sem rodar há mais de 16 horas); em dia, não aparece nada. Regra em `lib/conexoes.ts` (testada). As rotinas gravam `berry_conferido_em` / `berry_erro` / `meta_conferido_em` / `meta_erro` em `lancamentos` a cada consulta, mesmo sem número novo; o gatilho `proteger_estado_conexoes` só deixa o servidor escrever. É a exceção combinada à regra "informação nova entra como bloco".

## Vigia das conexões e avisos no Asana (Ricardo, 08/10/2026)
- Cada rotina marca que rodou na tabela `rotinas` (`berry`, `meta`, `avisos`). Mais de 16 horas sem rodar: faixa "Atualização automática parada" no topo da visão geral (só admin, só quando há problema).
- Avisos viram tarefa no Asana dele, projeto "Power Interno" (gid `1215606464571182`), atribuída a ele. O site não tem token do Asana: uma segunda rotina na nuvem do Claude ("Central Power: avisos no Asana", 12h25, 15h25 e 21h25 UTC, com o conector do Asana) faz GET em `/api/cron/avisos`, cria uma tarefa por item e confirma com POST. Usa o mesmo `META_ROTINA_SEGREDO`. Regra do que vira tarefa em `lib/avisos.ts` (testada): rotina parada (uma tarefa só, não uma por lançamento), conexão com erro, lançamento que perdeu rodada, e Berry/Meta não conectado em lançamento que já vende e ainda não fechou o carrinho. A tabela `avisos` evita tarefa repetida; problema resolvido sai dela (se voltar, gera tarefa nova).
- PENDENTE em 08/10/2026: a rotina "Central Power: avisos no Asana" foi criada (`trig_012uW7p6bZAfEWW2JEmJU2UQ`), mas com `COLE_O_SEGREDO_AQUI` no lugar do segredo, e o texto da rotina do Meta (`trig_01VUMQRFvGEYwNWR8c9vx3ZY`) ainda não manda o erro de leitura. A trava de segurança da sessão não deixa o Claude enviar o `META_ROTINA_SEGREDO` para dentro de uma rotina (nem criar, nem atualizar o texto): quem cola é o Ricardo, em https://claude.ai/code/routines. Depois de ele colar, rodar as duas uma vez e conferir a tarefa no Asana. Apagar esta linha quando estiver feito.
- A rotina de avisos não consegue avisar de si mesma: se ela parar, só a faixa da visão geral mostra.
- Rotina do Meta: quando não consegue ler uma conta, manda `{lancamento_id, erro}` para `/api/cron/meta`; o motivo aparece no cartão, no bloco do Meta em Editar lançamento ("Última leitura em…: N campanhas somadas" ou o erro) e vira tarefa. O site não consegue testar conta/filtro do Meta na hora de salvar, só na rodada seguinte. Trocar conta ou filtro zera a leitura anterior (gatilho).
- Berry: ao escolher o produto, a tela confirma na hora quantos ingressos e quanta receita achou.
- Encerramento sugerido: depois do último marco e do último checkpoint, o cartão mostra "Lançamento terminado" com o botão de encerrar (`podeEncerrar`); não encerra sozinho.

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
