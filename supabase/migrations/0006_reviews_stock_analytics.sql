-- ============================================================================
-- 0006: avaliações públicas, vitrine de estoque real e analytics de leads
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Avaliações públicas — cliente envia, entra sempre como rascunho
-- ----------------------------------------------------------------------------

-- Trava de tamanho: evita que um formulário público vire vetor de spam/abuso
-- (texto gigante, nomes vazios etc). Os depoimentos cadastrados manualmente
-- pelo admin (0001) já respeitam essas faixas na prática.
alter table public.testimonials
  add constraint testimonials_client_name_length check (char_length(client_name) between 2 and 80),
  add constraint testimonials_quote_length check (char_length(quote) between 10 and 600),
  add constraint testimonials_model_bought_length check (model_bought is null or char_length(model_bought) <= 60);

-- Política adicional (permissiva, soma com a de admin já existente): visitante
-- anônimo pode inserir, mas só com published = false — nunca entra no ar sem
-- passar pela moderação do Lucas na aba Depoimentos.
create policy "testimonials: envio público (sempre como rascunho)"
  on public.testimonials
  for insert
  to anon
  with check (published = false);

-- ----------------------------------------------------------------------------
-- 2. Vitrine de estoque real — modelos efetivamente disponíveis agora
--
-- Diferente de site_models (curadoria de marketing), isso reflete o estoque
-- de verdade em public.devices. IMPORTANTE: esta view é criada SEM
-- security_invoker (fica no padrão "definer"), de propósito — ela roda com
-- os privilégios de quem a criou, então consegue ler devices mesmo devices
-- tendo RLS 100% travada para admins. Só expomos as colunas abaixo: nunca
-- cost_price nem imei (isso é o que torna essa decisão segura).
-- ----------------------------------------------------------------------------
create or replace view public.available_devices as
select
  id,
  model,
  storage_gb,
  color,
  condition,
  photo_url,
  created_at
from public.devices
where status = 'em_estoque';

grant select on public.available_devices to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Eventos do site — base para medir entrada de leads (session_start,
-- cliques de WhatsApp, envio de avaliação etc).
-- ----------------------------------------------------------------------------
create table if not exists public.site_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  event_type text not null check (event_type in ('session_start', 'whatsapp_click', 'stock_view', 'review_submit')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  constraint site_events_session_id_length check (char_length(session_id) between 1 and 100),
  constraint site_events_metadata_size check (char_length(metadata::text) <= 2000)
);

alter table public.site_events enable row level security;

-- Só insert público (write-only) — ninguém de fora consegue ler os eventos
-- de volta, então não dá pra usar isso pra "espiar" tráfego do concorrente.
-- O linter do Supabase acusa "WITH CHECK (true)" como policy permissiva
-- demais — aqui é intencional: qualquer visitante anônimo deve poder
-- registrar um evento, e a validação de forma (event_type/session_id/
-- tamanho do metadata) já está garantida pelos CHECK constraints da tabela.
create policy "site_events: insercao publica"
  on public.site_events
  for insert
  to anon
  with check (true);

create policy "site_events: leitura só para admins"
  on public.site_events
  for select
  using (public.is_admin());

create index if not exists site_events_created_at_idx on public.site_events (created_at);
create index if not exists site_events_type_idx on public.site_events (event_type);

notify pgrst, 'reload schema';
notify pgrst, 'reload config';
