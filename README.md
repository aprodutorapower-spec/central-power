# Controle de Lançamentos (Power)

Painel onde cada estrategista da Power registra os experts e os lançamentos pagos que cuida, e onde o Ricardo acompanha tudo num lugar só.

Endereço: https://central-power.vercel.app

## Quem vê o quê

- **Estrategista:** vê e edita só os próprios experts e lançamentos.
- **Admin (Ricardo):** vê e edita tudo.
- Sem login não se vê nada. Essa separação é garantida no banco de dados, não só na tela.

## Visão geral (admin)

É a primeira tela do admin e responde a uma pergunta: **com quem falar primeiro, e por quê**.

- **Onde começar:** o estrategista mais urgente, só com os problemas em uma frase (por exemplo: "2 lançamentos abaixo da meta de ingressos, CPA 34% acima da meta, 1 lançamento com grupo de WhatsApp abaixo de 95%") e um botão para abrir os lançamentos dele.
- **Precisam de atenção:** os estrategistas que têm algo abaixo da meta ou sem dados, do pior para o melhor. Cada cartão mostra a situação (cor, ícone e texto), quantos lançamentos estão abaixo / na meta / acima, ingressos contra a meta, CPA médio contra a meta, o pior lançamento com o motivo e o lançamento mais defasado.
- **Sem nada abaixo da meta:** os demais, em uma linha cada, para não competir por atenção.
- **Sem meta definida:** lançamentos que ainda precisam de meta, com preenchimento direto na lista. O botão **Sem tráfego pago** tira o lançamento da cobrança de CPA (ele deixa de aparecer como "sem meta").

O estrategista aparece com a urgência do seu pior lançamento. Clicar nele abre a visão do estrategista.

## Visão do estrategista

Todos os lançamentos ativos de um estrategista numa tela só, do pior para o melhor. Os que estão na meta ou acima ficam recolhidos em **Em dia (N)**, no fim.

Cada lançamento é um cartão com o expert, o tipo, quantos dias faltam para o D0 (ou "D+N" depois dele) e o **motivo da urgência** em destaque. Abaixo, oito blocos do mesmo tamanho:

- **Ingressos:** vendidos, meta, esperado até hoje e a barra com o risco do ritmo esperado.
- **CPA:** atual, meta (ou o teto de mercado) e a seta de tendência desde a atualização anterior.
- **Grupo de WhatsApp:** pessoas no grupo e o percentual dos ingressos, contra o mínimo de 95%.
- **Verba investida:** quanto já foi, e o percentual do total previsto.
- **Receita de ingressos** e **ticket médio**.
- **Próximo na linha do tempo** e **checkpoints atrasados**, com os dias de atraso.

No rodapé do cartão ficam os botões e o status marcado pelo estrategista, com há quanto tempo ele atualizou.

Botões do cartão:

- **Copiar cobrança:** copia um texto curto e cordial, com os números do problema, pronto para colar no WhatsApp. Só copia; não envia nada. Não aparece quando não há o que cobrar.
- **Linha do tempo** (ou clicar em qualquer ponto do cartão): abre uma janela no meio da tela com a linha do tempo completa, sem sair da página. Dá para marcar checkpoints como feitos ali mesmo.
- **Abrir lançamento:** vai para a página completa.

**← Visão geral** volta para a visão geral na mesma altura em que ela estava.

O estrategista vê a mesma tela dos próprios lançamentos, em **Meus lançamentos** (é onde ele cai ao entrar), sem o botão de cobrança.

### Rotina de 5 minutos

1. Abra a **Visão geral** e leia "Onde começar".
2. Clique no estrategista. Leia o motivo de cada cartão que não está em "Em dia".
3. Clique em **Copiar cobrança** e cole no WhatsApp dele.
4. Volte e passe para o próximo de "Precisam de atenção".

## Estrategistas: incluir, liberar acesso e excluir

Tudo em **Estrategistas**, no menu do admin.

**Incluir:** digite o nome no campo do topo e clique em **Adicionar**. Ele aparece como "Pendente", ainda sem acesso.

**Liberar o acesso:**

1. No cartão dele, digite o e-mail e clique em **Gerar link de acesso**.
2. Clique em **Copiar link** e envie para ele (WhatsApp, por exemplo). O link vale 24 horas e funciona uma única vez.
3. Ele abre o link, clica em **Entrar** e cria a própria senha. A partir daí entra com e-mail e senha.
4. Se ele esquecer a senha, gere um link novo no mesmo lugar.

Situações: **Pendente** (ainda sem acesso), **Convidado** (link gerado, ainda não entrou) e **Ativo** (já entrou).

**Excluir quem saiu da equipe:** no cartão dele, clique em **Excluir estrategista** e confirme. O acesso é apagado na hora e não dá para desfazer. Os experts e lançamentos dele **continuam no sistema**, no grupo "Sem responsável", até você escolher outro estrategista em **Experts**. O nome dele permanece no histórico das atualizações e dos checkpoints já feitos.

## Como cadastrar um expert

- **Estrategista:** em **Meus experts** (no menu), digite o nome e clique em **Adicionar**. O expert já fica no nome dele.
- **Admin:** em **Experts**, digite o nome, escolha o estrategista responsável e clique em **Adicionar**. Para mudar o responsável depois, escolha outro nome na lista ao lado do expert.

## Como cadastrar um lançamento

1. Em **Experts** (ou **Meus experts**), clique no expert.
2. Clique em **Novo lançamento**.
3. Dê um nome, escolha o tipo (**LP**, evento único, ou **LPS**, semanal 5+1) e informe o **D0** (dia do evento; no LPS, a segunda-feira da aula 1).
4. O sistema sugere as outras datas: **DP0** (só no LPS, D0+6) e **DFC** (LP: D0+4; LPS: DP0+2), que podem ser ajustadas. **M0** e **DV0** (início da venda de ingressos) são opcionais. O **DE0** não é preenchido: o sistema usa D0-7 e move junto quando o D0 muda. Cada data tem um "?" ao lado explicando o que ela é.
5. Preencha as **metas**: meta de ingressos, **ticket do ingresso** e **verba total prevista** (ou marque **Sem tráfego pago**). Para o estrategista esses campos são obrigatórios na criação. A meta de CPA não é obrigatória: em branco, vale o dobro do ticket.
6. Clique em **Salvar lançamento**.

Lançamento com D0 no futuro aparece como **Previsto**; entre o D0 e o DFC, **Em andamento**; depois do DFC, **Carrinho fechado**. Quando acabar de vez, abra o lançamento e clique em **Encerrar lançamento** (dá para reabrir).

## Metas e status de meta

Cada lançamento tem:

- **Meta de ingressos:** total a vender.
- **Ticket do ingresso:** o preço do ingresso. Se houver mais de um preço (lotes, VIP, cupons), use o ticket médio. É a base da régua de mercado do CPA.
- **Verba total prevista:** quanto será investido em anúncios no lançamento inteiro. As telas mostram a verba investida até agora contra esse total.
- **Meta de CPA (não obrigatória):** valor máximo aceitável por ingresso. Quando cadastrada, é ela que vale. Em branco, o sistema usa a régua de mercado: **o dobro do ticket do ingresso**. Com a marcação **Sem tráfego pago**, não se cobra CPA.
- **Fim das vendas de ingressos:** em branco, vale o D0. O início é sempre o **DV0** do lançamento (ou o DE0, se não houver DV0); não há um segundo campo para isso.

Quem preenche:

- **O estrategista define as metas ao criar o lançamento** e pode corrigir enquanto a venda de ingressos não começou.
- **A partir do início das vendas (DV0), só o admin altera.** Adiar o DV0 depois disso não reabre as metas. Isso é garantido no banco, não só na tela.
- O admin pode preencher ou corrigir a qualquer momento: na visão geral, no bloco **Sem meta definida**, ou em **Editar lançamento**.

Com as metas, o sistema calcula sozinho, sem guardar no banco:

- **Ritmo esperado:** quantos ingressos deveriam estar vendidos hoje, em linha reta do início ao fim das vendas.
- **Status de ingressos:** **Acima** (10% ou mais acima do esperado), **Na meta** (até 10% para cima ou para baixo) ou **Abaixo**.
- **Status de CPA:** **Acima** quando o CPA está 10% ou mais abaixo da meta (gastando menos), **Na meta** na faixa de 10%, **Abaixo** quando passa da meta em mais de 10%. Sem ingresso vendido, fica "Sem dado".
- **Status do grupo de WhatsApp:** a régua de mercado é ter no grupo **pelo menos 95%** de quem comprou ingresso. Abaixo disso o lançamento fica **Abaixo da meta**, mesmo com ingressos e CPA em ordem: conta como critério principal, entra no motivo e no texto da cobrança. Sem o número do grupo informado, não pune.
- **Sem meta** (falta preencher a meta de ingressos, ou o ticket e a meta de CPA), **Sem dados** (as vendas começaram e não há métricas), **Vendas não começaram** e **Sem tráfego pago** (marcado pelo admin: não se cobra CPA).

A página do lançamento mostra a barra de ingressos com um risco marcando onde deveria estar hoje, e o formulário de atualização mostra as metas e o status enquanto o estrategista digita.

A **urgência** (quem aparece primeiro) usa, nesta ordem: ingressos, CPA e grupo de WhatsApp abaixo da meta (pesa mais quanto mais critérios estiverem abaixo, quando o desvio é grande e quando o D0 está perto), depois checkpoints atrasados, dias sem atualização e status "Em risco". Tudo isso vive em `lib/urgencia.ts`, com os pesos nomeados no topo do arquivo.

## Linha do tempo do lançamento

Ao abrir um lançamento aparecem, em ordem de data, os marcos e os checkpoints (as entregas que precisam estar prontas em cada momento), com o **próximo** em destaque e a contagem de **atrasados**.

- **Verde:** feito, ou vence em mais de 3 dias.
- **Amarelo:** vence hoje ou nos próximos 3 dias.
- **Vermelho:** venceu e continua pendente.
- Marcos (M0, DV0, DE0, D0, DP0, DFC) não são "feitos": só contam os dias e ficam cinza depois que passam.

Em cada checkpoint: **Marcar como feito** (guarda a data e quem marcou) e, em **Mais opções**, trocar a data ou marcar **Não se aplica**. Se o D0 do lançamento mudar, os checkpoints ainda pendentes andam junto.

## Como atualizar um lançamento (estrategista)

Leva menos de 5 minutos e funciona no celular.

1. Em **Meus lançamentos**, clique em **Atualizar lançamento** no cartão e depois no botão **Atualizar lançamento** da página.
2. Escolha o status: **No trilho** (verde), **Atenção** (amarelo) ou **Em risco** (vermelho).
3. Preencha os números até agora: **verba investida**, **ingressos vendidos**, **receita de ingressos** e quantas pessoas estão **no grupo de WhatsApp**. Eles já vêm com os valores da última vez; é só corrigir.
4. Clique em **Salvar atualização**.

O sistema calcula o **CPA** (verba ÷ ingressos), o **ticket médio** (receita de ingressos ÷ ingressos) e o **comparecimento no grupo** (pessoas no grupo de WhatsApp ÷ ingressos). O status (No trilho / Atenção / Em risco) é escolhido por quem atualiza; o status de meta (Abaixo / Na meta / Acima) é calculado pelo sistema. Cada atualização vira uma "foto" datada no **Histórico de métricas**, com quem preencheu, e o topo da página passa a mostrar "Atualizado há X dias" (fica em vermelho quando passa de 7 dias).

## Como editar os modelos de checkpoint

1. Entre como admin e abra **Modelos de checkpoint** no menu.
2. Há uma lista para LP e outra para LPS. Clique num checkpoint para editar o título, o prazo em dias a partir do D0 (negativo é antes, positivo é depois) e a descrição.
3. Use **+ Novo checkpoint** para incluir e **Remover** para tirar.

As mudanças valem só para os lançamentos criados depois; os que já existem não são alterados.

## Conexão com a Berry

Em cada expert há o botão **Conectar Berry**. Cole a chave de API da conta Berry do expert (quem gera é o suporte da Berry; peça uma chave só de leitura) e, em cada lançamento, escolha na lista o produto que é o ingresso. A tela mostra quantas vendas pagas a Berry registra desde o DV0. A chave fica guardada cifrada e não aparece de novo para ninguém. Por enquanto a conexão só mostra a contagem; as métricas continuam sendo preenchidas na atualização do lançamento.

## Rotina de coordenação: 3 toques por semana

- **Segunda:** o que vence nos próximos 7 dias e quem ainda não atualizou.
- **Quarta:** métricas e atrasos.
- **Sexta, 12h:** painel revisado 1 hora antes da call das 13h.

## Próximos passos

1. **Decidir como o Ricardo será avisado e como os estrategistas serão cobrados** (Telegram, e-mail, WhatsApp, cobrança automática pelo sistema ou apenas o painel). Adiado pelo Ricardo em 06/10/2026, para depois dos ajustes no sistema.
2. Pauta automática da call de sexta.
3. Integrações: Berry Pay preenchendo ingressos e receita sozinha, Meta Ads por BM em modo leitura, Asana.
4. Lançamentos perpétuos.
5. Teste de aceite com os estrategistas.
6. Domínio próprio.
7. Melhorias de tela que ficaram para depois (lista completa em `docs/auditoria-ux.md`): separar experts desativados e lançamentos encerrados das listas, confirmação ao encerrar lançamento ou desconectar a Berry, busca, textos de apoio maiores nas telas antigas, datas sem o ano quando for o ano atual.

## Para quem for mexer no código

- Next.js + Tailwind, Supabase (login e banco), publicado na Vercel.
- Mudanças de banco ficam em `supabase/migrations`, numeradas.
- Testes do cálculo de urgência e da ordenação do painel (com cenários fictícios, sem tocar no banco): `npm test`.
- Teste de isolamento entre estrategistas: `node --env-file=.env.local scripts/isolamento.mjs`. Ele cria dados fictícios, testa e apaga tudo no final.
- A página antiga da Central Power está guardada em `/legado.html`.
