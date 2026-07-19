-- Registra uma venda e marca o aparelho como vendido numa única transação.
-- SECURITY INVOKER (padrão): roda com os privilégios de quem chama, então
-- a RLS de devices/sales continua valendo normalmente — só admins
-- conseguem executar isso com sucesso.
create or replace function public.register_sale(
  p_device_id uuid,
  p_sale_price numeric,
  p_client_name text,
  p_client_phone text,
  p_client_gender text,
  p_payment_method text,
  p_sale_date date,
  p_notes text
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
    client_gender, payment_method, sale_date, notes
  ) values (
    p_device_id, p_sale_price, p_client_name, p_client_phone,
    nullif(p_client_gender, ''), p_payment_method, coalesce(p_sale_date, current_date), p_notes
  )
  returning * into v_sale;

  return v_sale;
end;
$$;

revoke execute on function public.register_sale(uuid, numeric, text, text, text, text, date, text) from anon;
grant execute on function public.register_sale(uuid, numeric, text, text, text, text, date, text) to authenticated;

-- Bucket público para fotos usadas no site (modelos, futuramente foto do
-- Lucas). Leitura pública (são só fotos de marketing), escrita só admin.
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

create policy "site-images: leitura pública"
  on storage.objects
  for select
  using (bucket_id = 'site-images');

create policy "site-images: upload só admin"
  on storage.objects
  for insert
  with check (bucket_id = 'site-images' and public.is_admin());

create policy "site-images: update só admin"
  on storage.objects
  for update
  using (bucket_id = 'site-images' and public.is_admin())
  with check (bucket_id = 'site-images' and public.is_admin());

create policy "site-images: delete só admin"
  on storage.objects
  for delete
  using (bucket_id = 'site-images' and public.is_admin());
