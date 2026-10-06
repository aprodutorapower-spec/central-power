# Controle de Lançamentos (Power)

Painel onde cada estrategista da Power registra os experts e os lançamentos pagos que cuida, e onde o Ricardo acompanha tudo num lugar só.

Endereço: https://central-power.vercel.app

## Quem vê o quê

- **Estrategista:** vê e edita só os próprios experts e lançamentos.
- **Admin (Ricardo):** vê e edita tudo.
- Sem login não se vê nada. Essa separação é garantida no banco de dados, não só na tela.

## Como liberar o acesso de um estrategista

1. Entre como admin e abra **Estrategistas** no menu.
2. Digite o e-mail do estrategista e clique em **Gerar link de acesso**.
3. Clique em **Copiar link** e envie para ele (WhatsApp, por exemplo). O link vale 24 horas e funciona uma única vez.
4. Ele abre o link, clica em **Entrar** e cria a própria senha. A partir daí entra com e-mail e senha.
5. Se ele esquecer a senha, gere um link novo no mesmo lugar.

Situações: **Pendente** (ainda sem acesso), **Convidado** (link gerado, ainda não entrou) e **Ativo** (já entrou).

## Como cadastrar um expert

- **Estrategista:** na tela inicial (**Meus experts**), digite o nome e clique em **Adicionar**. O expert já fica no nome dele.
- **Admin:** na tela inicial (**Experts**), digite o nome, escolha o estrategista responsável e clique em **Adicionar**. Para mudar o responsável depois, escolha outro nome ao lado do expert e clique em **Trocar**.

## Como cadastrar um lançamento

1. Na tela inicial, clique no expert.
2. Clique em **Novo lançamento**.
3. Dê um nome, escolha o tipo (**LP**, evento único, ou **LPS**, semanal 5+1) e informe o **D0** (dia do evento; no LPS, a segunda-feira da aula 1).
4. O sistema calcula as outras datas: **DE0** (D0-7), **DP0** (só no LPS, D0+6) e **DFC** (LP: D0+4; LPS: DP0+2). Todas podem ser ajustadas. **M0** e **DV0** são opcionais.
5. Informe a meta de ingressos, se já tiver, e clique em **Salvar lançamento**.

Lançamento com D0 no futuro aparece como **Previsto**; entre o D0 e o DFC, **Em andamento**; depois do DFC, **Carrinho fechado**. Quando acabar de vez, abra o lançamento e clique em **Encerrar lançamento** (dá para reabrir).

## Como editar os modelos de checkpoint

Entra na etapa 3 (em construção).

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
