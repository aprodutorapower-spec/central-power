# Controle de Lançamentos (Power)

Painel onde cada estrategista da Power registra os experts e os lançamentos pagos que cuida, e onde o Ricardo acompanha tudo num lugar só.

Endereço: https://central-power.vercel.app

## Quem vê o quê

- **Estrategista:** vê e edita só os próprios experts e lançamentos.
- **Admin (Ricardo):** vê e edita tudo.
- Sem login não se vê nada. Essa separação é garantida no banco de dados, não só na tela.

## Visão geral (admin)

É a primeira tela do admin. Mostra todos os lançamentos ativos de todos os experts, cada um com: status, estrategista, expert, tipo, próximo item da linha do tempo com os dias que faltam, quantos checkpoints estão atrasados, os números da última atualização (verba, ingressos, grupo de WhatsApp, CPA, ticket médio) e há quanto tempo foi atualizado (em vermelho quando passa de 7 dias ou nunca foi).

- **Prioridades** (padrão): lista única, com o que precisa de atenção no topo. A ordem é: mais checkpoints atrasados, depois mais tempo sem atualização, depois status "Em risco".
- **Por estrategista**: agrupado em Estrategista > Expert > Lançamento. Estrategista sem lançamento ativo também aparece, para ficar claro quem ainda não cadastrou.
- **Filtros** por estrategista, status e tipo.

Clicar num lançamento abre a página dele.

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
5. Informe a meta de ingressos, se já tiver, e clique em **Salvar lançamento**.

Lançamento com D0 no futuro aparece como **Previsto**; entre o D0 e o DFC, **Em andamento**; depois do DFC, **Carrinho fechado**. Quando acabar de vez, abra o lançamento e clique em **Encerrar lançamento** (dá para reabrir).

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

O sistema calcula o **CPA** (verba ÷ ingressos), o **ticket médio** (receita de ingressos ÷ ingressos) e o **comparecimento no grupo** (pessoas no grupo de WhatsApp ÷ ingressos). O status é escolhido por quem atualiza; não é calculado. Cada atualização vira uma "foto" datada no **Histórico de métricas**, com quem preencheu, e o topo da página passa a mostrar "Atualizado há X dias" (fica em vermelho quando passa de 7 dias).

## Como editar os modelos de checkpoint

1. Entre como admin e abra **Modelos de checkpoint** no menu.
2. Há uma lista para LP e outra para LPS. Clique num checkpoint para editar o título, o prazo em dias a partir do D0 (negativo é antes, positivo é depois) e a descrição.
3. Use **+ Novo checkpoint** para incluir e **Remover** para tirar.

As mudanças valem só para os lançamentos criados depois; os que já existem não são alterados.

## Rotina de coordenação: 3 toques por semana

- **Segunda:** o que vence nos próximos 7 dias e quem ainda não atualizou.
- **Quarta:** métricas e atrasos.
- **Sexta, 12h:** painel revisado 1 hora antes da call das 13h.

## Próximos passos

1. **Decidir como o Ricardo será avisado e como os estrategistas serão cobrados** (Telegram, e-mail, WhatsApp, cobrança automática pelo sistema ou apenas o painel).
2. Pauta automática da call de sexta.
3. Integrações: Meta Ads por BM em modo leitura, Berry Pay, Asana.
4. Lançamentos perpétuos.
5. Teste de aceite com os estrategistas.
6. Domínio próprio.

## Para quem for mexer no código

- Next.js + Tailwind, Supabase (login e banco), publicado na Vercel.
- Mudanças de banco ficam em `supabase/migrations`, numeradas.
- Teste de isolamento entre estrategistas: `node --env-file=.env.local scripts/isolamento.mjs`. Ele cria dados fictícios, testa e apaga tudo no final.
- A página antiga da Central Power está guardada em `/legado.html`.
