import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { uploadSiteImage } from '../../lib/storage'
import type { SiteModel } from '../../lib/types'
import { ConfirmButton } from '../ConfirmButton'

export function ModelosTab() {
  const [models, setModels] = useState<SiteModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('site_models')
      .select('*')
      .order('display_order', { ascending: true })
    if (error) setError('Não consegui carregar os modelos.')
    else setModels((data ?? []) as SiteModel[])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function addModel() {
    const { error } = await supabase.from('site_models').insert({
      label: 'Novo modelo',
      tag: null,
      display_order: models.length + 1,
      visible: false,
    })
    if (error) setError('Não consegui criar o modelo.')
    else load()
  }

  async function updateModel(id: string, patch: Partial<SiteModel>) {
    setModels((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
    const { error } = await supabase.from('site_models').update(patch).eq('id', id)
    if (error) {
      setError('Não consegui salvar essa alteração.')
      load()
    }
  }

  async function deleteModel(id: string) {
    const { error } = await supabase.from('site_models').delete().eq('id', id)
    if (error) setError('Não consegui remover esse modelo.')
    else load()
  }

  async function handleUpload(id: string, file: File) {
    setUploadingId(id)
    setError(null)
    try {
      const url = await uploadSiteImage(file, 'models')
      await updateModel(id, { photo_url: url })
    } catch {
      setError('Não consegui subir essa imagem. Tente um arquivo menor (JPG/PNG).')
    } finally {
      setUploadingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          O que estiver marcado como "visível" aparece na vitrine do site público.
        </p>
        <button
          type="button"
          onClick={addModel}
          className="rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-white hover:bg-terracotta-dark"
        >
          + Novo modelo
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading && <p className="text-sm text-ink-muted">Carregando…</p>}
        {!loading && models.length === 0 && (
          <p className="text-sm text-ink-muted">Nenhum modelo cadastrado ainda.</p>
        )}

        {models.map((model) => (
          <div key={model.id} className="rounded-2xl border border-border bg-card p-4">
            <div
              className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-cream-soft"
            >
              {model.photo_url ? (
                <img src={model.photo_url} alt={model.label} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-ink-muted">Sem foto</span>
              )}
              {uploadingId === model.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs text-ink">
                  Enviando…
                </div>
              )}
            </div>

            <input
              ref={(el) => {
                fileInputs.current[model.id] = el
              }}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(model.id, file)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => fileInputs.current[model.id]?.click()}
              className="mt-2 w-full rounded-lg border border-border py-1.5 text-xs font-medium text-ink hover:bg-cream-soft"
            >
              Trocar foto
            </button>

            <div className="mt-3 space-y-2">
              <input
                value={model.label}
                onChange={(e) => updateModel(model.id, { label: e.target.value })}
                className="w-full rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium focus:border-terracotta focus:outline-none"
              />
              <select
                value={model.tag ?? ''}
                onChange={(e) => updateModel(model.id, { tag: e.target.value || null })}
                className="w-full rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs focus:border-terracotta focus:outline-none"
              >
                <option value="">Sem selo</option>
                <option value="lançamento">Lançamento</option>
                <option value="mais vendido">Mais vendido</option>
                <option value="melhor custo">Melhor custo</option>
              </select>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                <input
                  type="checkbox"
                  checked={model.visible}
                  onChange={(e) => updateModel(model.id, { visible: e.target.checked })}
                  className="h-4 w-4 accent-terracotta"
                />
                Visível no site
              </label>
              <ConfirmButton label="Remover" onConfirm={() => deleteModel(model.id)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
