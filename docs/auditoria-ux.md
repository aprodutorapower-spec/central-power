# Auditoria de UX e UI — Controle de Lançamentos

Feita em 07/10/2026, olhando todas as telas no computador e no celular, como admin e como estrategista. Os achados estão em ordem de prioridade para o objetivo desta entrega: o Ricardo terminar cada revisão em cerca de 5 minutos, sabendo quem cobrar primeiro e por quê.

Situação de cada item: **Feito** (já resolvido), **Etapa B**, **Etapa C** ou **Depois** (fica em "Próximos passos" no README).

## 1. O que atrapalha a decisão do Ricardo

| # | Achado | Por que importa | Situação |
|---|--------|-----------------|----------|
| 1 | A visão geral ordena por checkpoint atrasado e tempo sem atualização. Ingressos e CPA, que são o que define se um lançamento vai bem, não entram na ordem. | O topo da lista não é necessariamente o maior problema. | **Feito** na Etapa B |
| 2 | Não havia meta de CPA nem ritmo esperado de ingressos. O número "70 de 300" não diz se está bom ou ruim para o dia de hoje. | Sem referência, cada cartão exige conta de cabeça. | **Feito**: metas, ritmo esperado e status Abaixo / Na meta / Acima |
| 3 | A visão geral mostra lançamentos, não estrategistas. Para saber quem cobrar, é preciso ler todos os cartões e agrupar mentalmente. | A pergunta do Ricardo é "com quem eu falo primeiro". | **Feito** na Etapa B |
| 4 | Todos os cartões têm o mesmo peso visual, com 8 números cada, estejam bem ou mal. | O que está bem compete por atenção com o que está mal. | **Feito** na visão macro; visão do estrategista na Etapa C |
| 5 | Não há o motivo em palavras. O Ricardo vê números e precisa concluir sozinho o que cobrar. | A frase do motivo é o que vira a cobrança. | Frase do motivo **feita**; "Copiar cobrança" na Etapa C |
| 6 | Para ver a linha do tempo é preciso sair da visão geral, abrir o lançamento e voltar. | Cada ida e volta custa tempo e perde a posição na lista. | Etapa C (painel lateral) |
| 7 | O histórico de métricas é só uma tabela; não dá para ver tendência (melhorando ou piorando). | Um CPA ruim caindo é diferente de um CPA ruim subindo. | Etapa C (mini gráficos e seta de tendência) |
| 8 | Lançamento sem meta não aparecia como pendência em lugar nenhum. | Sem meta não há como avaliar. | **Feito**: bloco "Sem meta definida" com preenchimento rápido |

## 2. Leitura e hierarquia visual

| # | Achado | Situação |
|---|--------|----------|
| 9 | A fonte desenhava o zero como a letra "o": D0 aparecia "Do", DV0 "DVo", e 300 parecia "3oo". Afetava todos os marcos e números do sistema. | **Feito** (números alinhados em todo o sistema) |
| 10 | Na página do lançamento, "ingressos vendidos" e "CPA" apareciam duas vezes depois da entrada das metas. | **Feito** (ficou só no bloco das metas) |
| 11 | Na linha do tempo, todo checkpoint tem um botão vermelho "Marcar como feito". São 7 a 10 botões vermelhos numa tela em que vermelho também significa atraso. | Etapa C (vermelho só no próximo e nos atrasados; os demais discretos) |
| 12 | Status depende só da cor em vários pontos: a bolinha do status na visão geral e as bolinhas da linha do tempo não têm texto nem ícone. | Etapas B e C nas telas novas (cor + ícone + texto); linha do tempo na Etapa C |
| 13 | A opção escolhida em "Tipo" (LP/LPS) e o item "Próximo" usam borda vermelho-escuro sobre fundo preto, com pouco contraste. | Etapa C |
| 14 | Datas sempre com o ano ("10/10/2026"), o que alonga as linhas sem ajudar. | Etapa C (dia/mês quando o ano é o atual) |
| 15 | Textos de apoio muito pequenos (rótulos em 12px cinza). No notebook é legível; projetado na call fica no limite. | Etapas B e C nas telas novas; restante Depois |

## 3. Navegação

| # | Achado | Situação |
|---|--------|----------|
| 16 | O menu não mostra em que página a pessoa está. | Etapa C |
| 17 | Ao clicar num link, a tela fica parada até a página nova chegar; não há sinal de carregamento. | Etapa C |
| 18 | O estrategista cai em "Meus experts" e precisa de dois cliques para chegar ao lançamento que vai atualizar. Não vê os próprios lançamentos juntos. | Etapa C (ele ganha a própria versão da visão do estrategista) |
| 19 | "Editar lançamento", "Conectar Berry" e "Encerrar lançamento" ficam no fim da página, depois de toda a linha do tempo e do histórico. | Etapa C (sobem para o topo) |
| 20 | Experts desativados e lançamentos encerrados se misturam aos ativos nas listas do admin, só com o texto riscado. | Depois |

## 4. Celular

| # | Achado | Situação |
|---|--------|----------|
| 21 | Tudo funciona no celular, sem rolagem lateral, exceto a tabela do histórico de métricas (rola para o lado, o que é aceitável). | Sem ação |
| 22 | Na visão geral, os três cartões de resumo empilhados ocupam a primeira tela inteira antes de qualquer lançamento aparecer. | **Feito** na Etapa B |
| 23 | O formulário de atualização é bom no celular: campos grandes, teclado numérico, valores da última vez já preenchidos. Agora também mostra as metas e o status enquanto a pessoa digita. | **Feito** |

## 5. Formulários e mensagens

| # | Achado | Situação |
|---|--------|----------|
| 24 | O estrategista podia alterar a meta de ingressos do próprio lançamento. | **Feito**: metas só o admin edita, garantido no banco |
| 25 | Ao salvar a atualização aparece "Atualização salva", mas o formulário continua aberto e a pessoa não vê o resultado no topo sem rolar. | Etapa C |
| 26 | "Encerrar lançamento" e "Desconectar a Berry" agem sem pedir confirmação. Os dois podem ser desfeitos (reabrir, colar a chave de novo), então o risco é baixo. | Depois |
| 27 | Os estados vazios existem e são claros (sem experts, sem lançamentos, sem fotos de métricas). | Sem ação |
| 28 | Não há busca. Com 6 estrategistas e poucas dezenas de lançamentos ainda não faz falta. | Depois |

## 6. Consistência

| # | Achado | Situação |
|---|--------|----------|
| 29 | Dois vocabulários de status convivem: o do estrategista (No trilho / Atenção / Em risco, escolhido à mão) e o novo, calculado (Abaixo / Na meta / Acima). | Etapas B e C: o calculado manda na ordem e no destaque; o do estrategista aparece como informação e desempate |
| 30 | O README dizia que o status "não é calculado". Continua valendo para o status do estrategista, mas agora existe também o status de meta, calculado. | **Feito** (README atualizado) |
