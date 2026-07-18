-- ============================================================================
-- Lucas.iphones — schema inicial (rascunho para revisão)
-- Projeto Supabase: Lucas-iPhone (ORG Eloi)
--
-- Como aplicar: cole este arquivo no SQL Editor do Supabase e rode.
-- Depois de rodar, edite a seção final para inserir os e-mails
-- autorizados na tabela `admins` (Lucas + Eloi).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabela de administradores (allowlist)
-- ----------------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Ninguém lê/escreve essa tabela via API, nem autenticado.
-- Ela só é usada dentro das políticas de outras tabelas (subquery) e
-- é gerenciada manualmente por você via SQL Editor.
create policy "admins: sem acesso via API"
  on public.admins
  for all
  using (false);

-- Função auxiliar: verifica se o usuário logado está na allowlist.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

-- ----------------------------------------------------------------------------
-- 2. Estoque de aparelhos
-- ----------------------------------------------------------------------------
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  model text not null,                 -- ex: 'iPhone 15 Pro'
  storage_gb integer,
  color text,
  condition text check (condition in ('lacrado', 'seminovo')),
  cost_price numeric(10, 2) not null,   -- sensível: nunca exposto ao público
  imei text,                            -- sensível
  status text not null default 'em_estoque'
    check (status in ('em_estoque', 'reservado', 'vendido')),
  created_at timestamptz not null default now(),
  sold_at timestamptz
);

alter table public.devices enable row level security;

create policy "devices: acesso total para admins"
  on public.devices
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. Vendas
-- ----------------------------------------------------------------------------
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices (id) on delete restrict,
  sale_price numeric(10, 2) not null,
  client_name text,
  client_phone text,
  client_gender text check (client_gender in ('feminino', 'masculino', 'nao_informado')),
  payment_method text,
  sale_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.sales enable row level security;

create policy "sales: acesso total para admins"
  on public.sales
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. Depoimentos (parte pública, mas escrita só por admin)
-- ----------------------------------------------------------------------------
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  quote text not null,
  model_bought text,
  published boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.testimonials enable row level security;

create policy "testimonials: leitura pública do que está publicado"
  on public.testimonials
  for select
  using (published = true);

create policy "testimonials: escrita só para admins"
  on public.testimonials
  for insert
  with check (public.is_admin());

create policy "testimonials: update só para admins"
  on public.testimonials
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "testimonials: delete só para admins"
  on public.testimonials
  for delete
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. Vitrine de modelos (marketing, separado do estoque real)
-- ----------------------------------------------------------------------------
create table if not exists public.site_models (
  id uuid primary key default gen_random_uuid(),
  label text not null,                 -- ex: 'iPhone 16 Pro Max'
  tag text,                             -- ex: 'lançamento', 'mais vendido', 'melhor custo'
  photo_url text,
  display_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.site_models enable row level security;

create policy "site_models: leitura pública do que está visível"
  on public.site_models
  for select
  using (visible = true);

create policy "site_models: escrita só para admins"
  on public.site_models
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 6. Conteúdo editável do site (textos, estatísticas)
-- ----------------------------------------------------------------------------
create table if not exists public.site_content (
  section_key text primary key,        -- ex: 'hero', 'sobre', 'stats'
  content jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

create policy "site_content: leitura pública"
  on public.site_content
  for select
  using (true);

create policy "site_content: escrita só para admins"
  on public.site_content
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 7. Views agregadas para o dashboard (não expõem linha a linha de custo)
-- ----------------------------------------------------------------------------
create or replace view public.daily_financials as
select
  s.sale_date,
  sum(s.sale_price) as revenue,
  sum(d.cost_price) as cost,
  sum(s.sale_price - d.cost_price) as profit,
  count(*) as units_sold
from public.sales s
join public.devices d on d.id = s.device_id
group by s.sale_date
order by s.sale_date;

alter view public.daily_financials set (security_invoker = true);
-- security_invoker faz essa view respeitar a RLS de devices/sales de quem
-- consulta — só admins conseguem ler, mesmo sendo uma view.

create or replace view public.model_popularity as
select
  d.model,
  date_trunc('month', s.sale_date) as month,
  count(*) as units_sold
from public.sales s
join public.devices d on d.id = s.device_id
group by d.model, date_trunc('month', s.sale_date)
order by month, units_sold desc;

alter view public.model_popularity set (security_invoker = true);

create or replace view public.client_demographics as
select
  client_gender,
  count(*) as total
from public.sales
group by client_gender;

alter view public.client_demographics set (security_invoker = true);

-- ============================================================================
-- ÚLTIMO PASSO (rodar manualmente, um de cada vez, DEPOIS que Lucas e Eloi
-- já tiverem feito login pelo menos uma vez via Google no app admin — porque
-- precisamos do user_id gerado pelo Supabase Auth):
--
-- insert into public.admins (user_id, email)
-- values ('<uuid-do-lucas-no-auth.users>', 'email-do-lucas@gmail.com');
--
-- insert into public.admins (user_id, email)
-- values ('<uuid-do-eloi-no-auth.users>', 'eloimuniz21@gmail.com');
--
-- Você encontra o user_id em Authentication > Users no painel do Supabase
-- depois do primeiro login de cada um.
-- ============================================================================
