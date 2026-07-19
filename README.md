# Lucas.iphones

Landing page + painel de gestão para o Lucas, vendedor de iPhones com atendimento pessoal.

Documentação de arquitetura completa: peça o arquivo `ARQUITETURA.md` gerado junto com este repositório, ou veja o histórico da conversa com o Claude. Resumo rápido abaixo.

## Estrutura

```
apps/
  site/     → landing page pública (Vite + React + TypeScript + Tailwind v4)
  admin/    → painel de gestão do Lucas (Vite + React + TypeScript + Tailwind v4)
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

## Painel de gestão (`apps/admin`)

```bash
cd apps/admin
npm install
cp .env.example .env.local   # mesma URL/anon key do Supabase
npm run dev
```

Login via Google (Supabase Auth). Depois do login, o app chama a função
`public.is_admin()` — se o e-mail não estiver na tabela `public.admins`, a
sessão é encerrada na hora e aparece uma mensagem de acesso negado. Essa
checagem no frontend é só cosmética: a proteção de verdade é a RLS de cada
tabela, que já bloqueia qualquer leitura/escrita de quem não está na
allowlist, mesmo que a chamada venha direto da API sem passar pelo app.

Páginas: Visão geral (KPIs rápidos — receita/custo/lucro do mês e de hoje,
gráficos completos ficam para a próxima fase), Estoque (CRUD de aparelhos),
Vendas (registra venda + marca o aparelho como vendido numa transação só,
via função `register_sale`), Conteúdo do site (textos do hero/sobre,
modelos em destaque com upload de foto, depoimentos com fluxo de
rascunho → publicação manual).

**Pendência de configuração manual (fora do alcance do Claude neste
sandbox):** o provedor Google do Supabase Auth precisa de um OAuth Client
ID/Secret do Google Cloud Console, associado à conta Google de quem for
configurar. Ver seção "Configurar login com Google" abaixo.

### Configurar login com Google

1. No [Google Cloud Console](https://console.cloud.google.com/), crie um
   projeto (ou use um existente) e em **APIs & Services → Credentials**,
   crie uma credencial **OAuth client ID** do tipo **Web application**.
2. Em **Authorized redirect URIs**, adicione a URL de callback que o
   Supabase mostra em **Authentication → Providers → Google** (algo como
   `https://bkronscivbhzccxadxyf.supabase.co/auth/v1/callback`).
3. Copie o **Client ID** e o **Client Secret** gerados e cole nos campos
   correspondentes em **Authentication → Providers → Google** no painel do
   Supabase, e ative o provedor.
4. Depois que Lucas e Eloi logarem pelo menos uma vez no admin, pegue o
   `user_id` de cada um em **Authentication → Users** no Supabase e rode o
   `insert into public.admins ...` (comentário no fim de
   `supabase/migrations/0001_initial_schema.sql`).

## Banco de dados (Supabase)

Projeto: `Lucas-iPhone` (org `ORG Eloi`), isolado dos demais projetos do GRPO.
Schema aplicado: tabelas `admins`, `devices`, `sales`, `testimonials`,
`site_models`, `site_content`, mais três views agregadas para o dashboard
(`daily_financials`, `model_popularity`, `client_demographics`) e a função
`register_sale` (venda + baixa de estoque numa transação só). Todas as
tabelas sensíveis têm RLS restrita a usuários na tabela `admins`. Bucket de
storage `site-images` para fotos dos modelos (leitura pública, escrita só
admin).

## Próximos passos

1. Configurar o login Google no Supabase (ver seção acima) e popular
   `public.admins` com Lucas e Eloi.
2. Rodar o admin localmente, cadastrar o estoque real e testar o fluxo
   completo de venda.
3. Retoques visuais no site público (fotos reais do Lucas e dos aparelhos,
   número de WhatsApp real).
4. Dashboard com gráficos completos: linha do tempo custo × receita × lucro,
   mapa de calor de modelos, perfil demográfico dos clientes.
5. Deploy: dois projetos Vercel separados (`apps/site` e `apps/admin`),
   variáveis de ambiente isoladas em cada um.
