import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Testimonial } from '../../lib/types'
import { Modal } from '../Modal'
import { ConfirmButton } from '../ConfirmButton'

type FormState = { client_name: string; quote: string; model_bought: string }
const emptyForm: FormState = { client_name: '', quote: '', model_bought: '' }

export function DepoimentosTab() {
  const [items, setItems] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('display_order', { ascending: true })
    if (error) setError('Não consegui carregar os depoimentos.')
    else setItems((data ?? []) as Testimonial[])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function togglePublished(t: Testimonial) {
    setItems((prev) => prev.map((i) => (i.id === t.id ? { ...i, published: !i.published } : i)))
    const { error } = await supabase
      .from('testimonials')
      .update({ published: !t.published })
      .eq('id', t.id)
    if (error) {
      setError('Não consegui atualizar esse depoimento.')
      load()
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from('testimonials').delete().eq('id', id)
    if (error) setError('Não consegui remover esse depoimento.')
    else load()
  }

  async function handleSave() {
    if (!form.client_name.trim() || !form.quote.trim()) return
    setSaving(true)
    const { error } = await supabase.from('testimonials').insert({
      client_name: form.client_name.trim(),
      quote: form.quote.trim(),
      model_bought: form.model_bought.trim() || null,
      published: false,
      display_order: items.length + 1,
    })
    setSaving(false)
    if (error) {
      setError('Não consegui salvar o depoimento.')
      return
    }
    setFormOpen(false)
    setForm(emptyForm)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          Novos depoimentos entram como rascunho — publique manualmente depois de confirmar com o
          cliente.
        </p>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="shrink-0 rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-white hover:bg-terracotta-dark"
        >
          + Novo
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {loading && <p className="text-sm text-ink-muted">Carregando…</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-ink-muted">Nenhum depoimento cadastrado ainda.</p>
        )}
        {items.map((t) => (
          <div key={t.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm italic text-ink">“{t.quote}”</p>
                <p className="mt-2 text-xs font-semibold text-ink">
                  {t.client_name}
                  {t.model_bought && <span className="font-normal text-ink-muted"> · {t.model_bought}</span>}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                  t.published ? 'bg-success/10 text-success' : 'bg-ink/10 text-ink-muted'
                }`}
              >
                {t.published ? 'Publicado' : 'Rascunho'}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <button
                type="button"
                onClick={() => togglePublished(t)}
                className="text-xs font-medium text-terracotta-dark hover:underline"
              >
                {t.published ? 'Despublicar' : 'Publicar'}
              </button>
              <ConfirmButton label="Remover" onConfirm={() => remove(t.id)} />
            </div>
          </div>
        ))}
      </div>

      {formOpen && (
        <Modal title="Novo depoimento" onClose={() => setFormOpen(false)}>
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink">Nome do cliente</span>
              <input
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink">Depoimento</span>
              <textarea
                value={form.quote}
                onChange={(e) => setForm({ ...form, quote: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink">Modelo comprado (opcional)</span>
              <input
                value={form.model_bought}
                onChange={(e) => setForm({ ...form, model_bought: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              />
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-ink-muted"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !form.client_name.trim() || !form.quote.trim()}
              className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Salvando…' : 'Salvar como rascunho'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
