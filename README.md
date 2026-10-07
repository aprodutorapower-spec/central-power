# Controle de Lançamentos (Power)

Painel onde cada estrategista da Power registra os experts e os lançamentos pagos que cuida, e onde o Ricardo acompanha tudo num lugar só.

Endereço: https://central-power.vercel.app

## Quem vê o quê

- **Estrategista:** vê e edita só os próprios experts e lançamentos.
- **Admin (Ricardo):** vê e edita tudo.
- Sem login não se vê nada. Essa separação é garantida no banco de dados, não só na tela.

## Visão geral (admin)

É a primeira tela do admin e responde a uma pergunta: **com quem falar primeiro, e por quê**.

- **Onde começar:** o estrategista mais urgente, com o motivo em uma frase (por exemplo: "3 lançamentos ativos, 2 abaixo da meta de ingressos, CPA 34% acima da meta") e um botão para abrir os lançamentos dele.
- **Operação:** quantos lançamentos ativos há em cada situação, verba total, ingressos vendidos contra a meta somada e CPA médio (verba total ÷ ingressos totais).
- **Precisam de atenção:** os estrategistas que têm algo abaixo da meta ou sem dados, do pior para o melhor. Cada cartão mostra a situação (cor, ícone e texto), quantos lançamentos estão abaixo / na meta / acima, ingressos contra a meta, CPA médio contra a meta, o pior lançamento com o motivo e o lançamento mais defasado.
- **Sem nada abaixo da meta:** os demais, em uma linha cada, para não competir por atenção.
- **Sem meta definida:** lançamentos que ainda precisam de meta, com preenchimento direto na lista. O botão **Sem tráfego pago** tira o lançamento da cobrança de CPA (ele deixa de aparecer como "sem meta").

O estrategista aparece com a urgência do seu pior lançamento. Clicar nele abre a **visão do estrategista**: todos os lançamentos ativos dele, os piores primeiro, cada um com o motivo, a barra de ingressos e o CPA contra a meta.

## Como liberar o acesso de um estrategista

1. Entre como admin e abra **Estrategistas** no menu.
2. Digite o e-mail do estrategista e clique em **Gerar link de acesso**.
3. Clique em **Copiar link** e envie para ele (WhatsApp, por exemplo). O link vale 24 horas e funciona uma única vez.
4. Ele abre o link, clica em **Entrar** e cria a própria senha. A partir daí entra com e-mail e senha.
5. Se ele esquecer a senha, gere um link novo no mesmo lugar.

Situações: **Pendente** (ainda sem acesso), **Convidado** (link gerado, ainda não entrou) e **Ativo** (já entrou).

## Como cadastrar um expert

- **Estrategista:** em **Meus experts**, digite o nome e clique em **Adicionar**. O expert já fica no nome dele.
- **Admin:** em **Experts**, digite o nome, escolha o estrategista responsável e clique em **Adicionar**. Para mudar o responsável depois, escolha outro nome na lista ao lado do expert.

## Como cadastrar um lançamento

1. Em **Experts** (ou **Meus experts**), clique no expert.
2. Clique em **Novo lançamento**.
3. Dê um nome, escolha o tipo (**LP**, evento único, ou **LPS**, semanal 5+1) e informe o **D0** (dia do evento; no LPS, a segunda-feira da aula 1).
4. O sistema calcula as outras datas: **DE0** (D0-7), **DP0** (só no LPS, D0+6) e **DFC** (LP: D0+4; LPS: DP0+2). Todas podem ser ajustadas. **M0** e **DV0** são opcionais.
5. Clique em **Salvar lançamento**. As metas são definidas pelo admin (veja abaixo).

Lançamento com D0 no futuro aparece como **Previsto**; entre o D0 e o DFC, **Em andamento**; depois do DFC, **Carrinho fechado**. Quando acabar de vez, abra o lançamento e clique em **Encerrar lançamento** (dá para reabrir).

## Metas e status de meta

Cada lançamento tem quatro campos que **só o admin edita** (o estrategista vê, mas não muda; isso é garantido no banco):

- **Meta de ingressos:** total a vender.
- **Meta de CPA:** valor máximo aceitável por ingresso.
- **Início e fim das vendas de ingressos:** em branco, valem o DV0 (ou o DE0, se não houver DV0) e o D0.

Onde preencher: na visão geral, no bloco **Sem meta definida** (ingressos e CPA, direto na lista), ou abrindo o lançamento e clicando em **Editar lançamento** (as quatro).

Com as metas, o sistema calcula sozinho, sem guardar no banco:

- **Ritmo esperado:** quantos ingressos deveriam estar vendidos hoje, em linha reta do início ao fim das vendas.
- **Status de ingressos:** **Acima** (10% ou mais acima do esperado), **Na meta** (até 10% para cima ou para baixo) ou **Abaixo**.
- **Status de CPA:** **Acima** quando o CPA está 10% ou mais abaixo da meta (gastando menos), **Na meta** na faixa de 10%, **Abaixo** quando passa da meta em mais de 10%. Sem ingresso vendido, fica "Sem dado".
- **Sem meta** (falta o admin preencher), **Sem dados** (as vendas começaram e não há métricas), **Vendas não começaram** e **Sem tráfego pago** (marcado pelo admin: não se cobra CPA).

A página do lançamento mostra a barra de ingressos com um risco marcando onde deveria estar hoje, e o formulário de atualização mostra as metas e o status enquanto o estrategista digita.

A **urgência** (quem aparece primeiro) usa, nesta ordem: ingressos e CPA abaixo da meta (pesa mais quando são os dois, quando o desvio é grande e quando o D0 está perto), depois checkpoints atrasados, dias sem atualização e status "Em risco". Tudo isso vive em `lib/urgencia.ts`, com os pesos nomeados no topo do arquivo.

## Linha do tempo do lançamento

Ao abrir um lançamento aparecem, em ordem de data, os marcos e os checkpoints (as entregas que precisam estar prontas em cada momento), com o **próximo** em destaque e a contagem de **atrasados**.

- **Verde:** feito, ou vence em mais de 3 dias.
- **Amarelo:** vence hoje ou nos próximos 3 dias.
- **Vermelho:** venceu e continua pendente.
- Marcos (M0, DV0, DE0, D0, DP0, DFC) não são "feitos": só contam os dias e ficam cinza depois que passam.

Em cada checkpoint: **Marcar como feito** (guarda a data e quem marcou) e, em **Mais opções**, trocar a data ou marcar **Não se aplica**. Se o D0 do lançamento mudar, os checkpoints ainda pendentes andam junto.

## Como atualizar um lançamento (estrategista)

Leva menos de 5 minutos e funciona no celular.

1. Abra o lançamento e clique em **Atualizar lançamento**.
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
2. Visão do estrategista completa (Etapa C): mini gráficos, painel lateral da linha do tempo e "Copiar cobrança". A lista completa de melhorias de tela está em `docs/auditoria-ux.md`.
3. Pauta automática da call de sexta.
4. Integrações: Berry Pay preenchendo ingressos e receita sozinha, Meta Ads por BM em modo leitura, Asana.
5. Lançamentos perpétuos.
6. Teste de aceite com os estrategistas.
7. Domínio próprio.
8. Melhorias de tela que ficaram para depois: separar experts desativados e lançamentos encerrados das listas, confirmação ao encerrar lançamento ou desconectar a Berry, busca, textos de apoio maiores nas telas antigas.

## Para quem for mexer no código

- Next.js + Tailwind, Supabase (login e banco), publicado na Vercel.
- Mudanças de banco ficam em `supabase/migrations`, numeradas.
- Testes do cálculo de urgência e da ordenação do painel (com cenários fictícios, sem tocar no banco): `npm test`.
- Teste de isolamento entre estrategistas: `node --env-file=.env.local scripts/isolamento.mjs`. Ele cria dados fictícios, testa e apaga tudo no final.
- A página antiga da Central Power está guardada em `/legado.html`.
