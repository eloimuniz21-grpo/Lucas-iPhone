-- Corrige avisos do linter de segurança do Supabase:
-- 1) search_path fixo na função is_admin (evita hijacking via search_path mutável)
-- 2) apenas usuários autenticados podem chamar a função via API — o role
--    anon não precisa dela (sempre retornaria false mesmo assim)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

revoke execute on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;
