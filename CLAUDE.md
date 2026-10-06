# Sistema de Controle de Lançamentos (Power)

## Quem é o usuário
Ricardo, gestor de projetos na Power. Não programa. Explique tudo em português simples, diga exatamente o que ele precisa clicar ou colar, e evite jargão.

## Stack
Next.js (App Router) + TypeScript + Tailwind, Supabase (Auth, Postgres, RLS), deploy na Vercel. Interface em português do Brasil.

## Regras fixas
- Nunca altere ou apague tabelas, dados ou apps que já existam no Supabase ou na Vercel conectados. Se houver dúvida sobre qual projeto usar, pergunte.
- Toda tabela nova tem RLS ativo. Estrategista só acessa dados ligados aos próprios experts. Admin acessa tudo. Sem acesso anônimo.
- Mudanças de banco sempre em migrations versionadas em supabase/migrations.
- Nunca coloque senhas, chaves ou tokens no código ou no git. Use variáveis de ambiente.
- Um commit por etapa, com mensagem clara.
- Visual: tema escuro com a logo e as cores da Power (logo-power.png na raiz do projeto).
- Marcos de lançamento usam os nomes M0, DV0, DE0, D0, DP0 e DFC, iguais aos do Asana.
- Dados de teste são sempre fictícios.

## Pendência aberta
Definir como o Ricardo será avisado e como os estrategistas serão cobrados. Lembre o Ricardo disso ao final de toda sessão até ser decidido.

## Próximos passos (fora do v1)
Pauta automática da call de sexta, integrações (Meta Ads em leitura, Berry Pay, Asana), lançamentos perpétuos, teste de aceite com os estrategistas, domínio próprio.

## Estado do projeto
- Repositório `aprodutorapower-spec/central-power`, projeto Vercel `central-power`, Supabase `pruntjhpcucfiudcdtpb`.
- A Central Power antiga (página única) ficou guardada em `public/legado.html`. As tabelas dela (`clients`, `tasks`, `sprints`, `daily_updates`, `client_kpis`) são legado: não mexer.
- Tabelas novas têm nome em português (`perfis`, `experts`, `expert_estrategistas`).
- Não há acesso direto ao banco por aqui: cada migration é colada pelo Ricardo no SQL Editor do Supabase.
- Next 16: o antigo `middleware.ts` chama-se `proxy.ts`. Ver AGENTS.md.

@AGENTS.md
