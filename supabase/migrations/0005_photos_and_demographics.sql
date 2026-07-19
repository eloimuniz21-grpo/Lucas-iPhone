-- ============================================================================
-- 0005: foto do aparelho no estoque + idade/cidade do cliente nas vendas
-- ============================================================================

-- Estoque: foto do aparelho, tirada no momento do cadastro (opcional).
alter table public.devices
  add column if not exists photo_url text;

-- Vendas: idade e cidade do cliente (opcionais) — alimentam os gráficos
-- demográficos do dashboard.
alter table public.sales
  add column if not exists client_age integer,
  add column if not exists client_city text;

alter table public.sales
  add constraint sales_client_age_check
  check (client_age is null or (client_age >= 0 and client_age <= 120));

-- register_sale precisa aceitar os dois novos campos opcionais. Recriamos a
-- função com a assinatura estendida (a antiga, de 8 parâmetros, é removida
-- porque o Postgres trata assinaturas diferentes como funções distintas).
drop function if exists public.register_sale(uuid, numeric, text, text, text, text, date, text);

create or replace function public.register_sale(
  p_device_id uuid,
  p_sale_price numeric,
  p_client_name text,
  p_client_phone text,
  p_client_gender text,
  p_payment_method text,
  p_sale_date date,
  p_notes text,
  p_client_age integer default null,
  p_client_city text default null
)
returns public.sales
language plpgsql
as $$
declare
  v_sale public.sales;
begin
  update public.devices
  set status = 'vendido', sold_at = now()
  where id = p_device_id and status <> 'vendido';

  if not found then
    raise exception 'Aparelho não encontrado ou já vendido.';
  end if;

  insert into public.sales (
    device_id, sale_price, client_name, client_phone,
    client_gender, payment_method, sale_date, notes,
    client_age, client_city
  ) values (
    p_device_id, p_sale_price, p_client_name, p_client_phone,
    nullif(p_client_gender, ''), p_payment_method, coalesce(p_sale_date, current_date), p_notes,
    p_client_age, nullif(p_client_city, '')
  )
  returning * into v_sale;

  return v_sale;
end;
$$;

revoke execute on function public.register_sale(uuid, numeric, text, text, text, text, date, text, integer, text) from anon;
grant execute on function public.register_sale(uuid, numeric, text, text, text, text, date, text, integer, text) to authenticated;

notify pgrst, 'reload schema';
notify pgrst, 'reload config';
