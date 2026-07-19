-- Modelos em destaque na vitrine (marketing, não é o estoque real).
-- Fotos ficam para o Lucas subir depois pelo painel admin.
insert into public.site_models (label, tag, display_order, visible) values
  ('iPhone 16 Pro Max', 'lançamento', 1, true),
  ('iPhone 15 Pro', 'mais vendido', 2, true),
  ('iPhone 13 Pro Max', 'melhor custo', 3, true)
on conflict do nothing;

-- Depoimento de exemplo trazido do protótipo original, marcado como NÃO
-- publicado até o Lucas confirmar que é um depoimento real e autorizado.
insert into public.testimonials (client_name, quote, model_bought, published, display_order) values
  ('Thiago Oliveira', 'O Lucas me explicou cada detalhe das câmeras e me ajudou a escolher o modelo ideal para meu trabalho. Entrega em mãos em SP foi o diferencial.', 'iPhone 15 Pro Max', false, 1)
on conflict do nothing;
