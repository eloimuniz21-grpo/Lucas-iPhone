# Lucas.iphones

Landing page + (em breve) painel de gestão para o Lucas, vendedor de iPhones com atendimento pessoal.

Documentação de arquitetura completa: peça o arquivo `ARQUITETURA.md` gerado junto com este repositório, ou veja o histórico da conversa com o Claude. Resumo rápido abaixo.

## Estrutura

```
apps/
  site/     → landing page pública (Vite + React + TypeScript + Tailwind v4)
  admin/    → painel de gestão do Lucas (próxima fase — ainda não criado)
supabase/
  migrations/ → schema versionado do banco (aplicado via Supabase MCP / SQL Editor)
```

## Site público (`apps/site`)

```bash
cd apps/site
npm install
cp .env.example .env.local   # preencha com a URL/anon key do projeto Supabase
                              # e o número de WhatsApp real do Lucas
npm run dev
```

O site lê conteúdo (textos, modelos em destaque, depoimentos) diretamente do
Supabase via `@supabase/supabase-js`, usando somente a chave `anon`/`publishable`
— a proteção dos dados sensíveis (estoque, custo, vendas) fica inteiramente a
cargo das políticas de RLS do banco, não do frontend.

Requisitos de UX seguidos: mobile-first, menu hamburguer no mobile, botão de
WhatsApp flutuante fixo, todas as seções testadas em viewport mobile (390px)
e desktop (1440px).

## Banco de dados (Supabase)

Projeto: `Lucas-iPhone` (org `ORG Eloi`), isolado dos demais projetos do GRPO.
Schema aplicado: tabelas `admins`, `devices`, `sales`, `testimonials`,
`site_models`, `site_content`, mais três views agregadas para o dashboard
(`daily_financials`, `model_popularity`, `client_demographics`). Todas as
tabelas sensíveis têm RLS restrita a usuários na tabela `admins`.

## Próximos passos

1. Lucas e Eloi fazem login pelo menos uma vez no futuro painel admin
   (Google OAuth) para gerar o `user_id` de cada um no Supabase Auth.
2. Rodar o `insert into public.admins ...` para os dois (ver comentário no
   fim de `supabase/migrations/0001_initial_schema.sql`).
3. Construir `apps/admin`: CRUD de estoque, registro de vendas, editor de
   conteúdo do site, dashboard com gráficos.
4. Deploy: dois projetos Vercel separados (`apps/site` e `apps/admin`),
   variáveis de ambiente isoladas em cada um.
