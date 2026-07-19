import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { uploadSiteImage } from '../../lib/storage'
import type { AboutContent, HeroContent, HeroFeature, StatsContent } from '../../lib/types'

function useContentSection<T extends object>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const { data, error } = await supabase
          .from('site_content')
          .select('content')
          .eq('section_key', key)
          .maybeSingle()
        if (!active) return
        if (!error && data?.content) setValue({ ...fallback, ...(data.content as object) } as T)
      } catch {
        // mantém o fallback em caso de erro de rede
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  async function save() {
    setSaving(true)
    setError(null)
    const { error } = await supabase
      .from('site_content')
      .upsert({ section_key: key, content: value, updated_at: new Date().toISOString() })
    setSaving(false)
    if (error) {
      setError('Não consegui salvar essa seção.')
    } else {
      setSavedAt(Date.now())
    }
  }

  return { value, setValue, loading, saving, savedAt, error, save }
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
        />
      )}
    </label>
  )
}

function SaveBar({ saving, savedAt, error, onSave }: { saving: boolean; savedAt: number | null; error: string | null; onSave: () => void }) {
  return (
    <div className="mt-4 flex items-center gap-3">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? 'Salvando…' : 'Salvar seção'}
      </button>
      {savedAt && !saving && <span className="text-xs text-success">Salvo ✓</span>}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}

const DEFAULT_FEATURES: HeroFeature[] = [
  { icon: '🛡️', label: 'Lacrados e seminovos originais' },
  { icon: '🧾', label: 'Nota fiscal' },
  { icon: '🚚', label: 'Entrega em mãos' },
]

const heroFallback: HeroContent = {
  badge: '',
  title: '',
  subtitle: '',
  clients_badge: '',
  photo_url: null,
  features: DEFAULT_FEATURES,
}
const statsFallback: StatsContent = { clients: '', years: '', sealed_pct: '', delivery: '' }
const aboutFallback: AboutContent = { title: '', paragraph1: '', paragraph2: '' }

export function TextosTab() {
  const hero = useContentSection('hero', heroFallback)
  const stats = useContentSection('stats', statsFallback)
  const about = useContentSection('about', aboutFallback)
  const [uploadingHeroPhoto, setUploadingHeroPhoto] = useState(false)
  const [heroPhotoError, setHeroPhotoError] = useState<string | null>(null)
  const heroPhotoInput = useRef<HTMLInputElement | null>(null)

  async function handleHeroPhotoUpload(file: File) {
    setUploadingHeroPhoto(true)
    setHeroPhotoError(null)
    try {
      const url = await uploadSiteImage(file, 'hero')
      hero.setValue({ ...hero.value, photo_url: url })
    } catch {
      setHeroPhotoError('Não consegui subir essa foto. Tenta um arquivo menor (JPG/PNG).')
    } finally {
      setUploadingHeroPhoto(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-ink">Hero (topo da página)</h2>
        {hero.loading ? (
          <p className="mt-2 text-sm text-ink-muted">Carregando…</p>
        ) : (
          <div className="mt-3 space-y-3">
            <Field label="Selo/badge" value={hero.value.badge} onChange={(v) => hero.setValue({ ...hero.value, badge: v })} />
            <Field label="Título" value={hero.value.title} onChange={(v) => hero.setValue({ ...hero.value, title: v })} multiline />
            <Field label="Subtítulo" value={hero.value.subtitle} onChange={(v) => hero.setValue({ ...hero.value, subtitle: v })} multiline />
            <Field
              label="Selo de clientes (ex: +200 clientes)"
              value={hero.value.clients_badge}
              onChange={(v) => hero.setValue({ ...hero.value, clients_badge: v })}
            />

            <div>
              <span className="mb-1 block text-sm font-medium text-ink">Foto do Lucas</span>
              <p className="mb-2 text-xs text-ink-muted">
                Aparece ao lado do texto principal do site. Se não subir nada, fica um espaço reservado
                no lugar.
              </p>
              <div className="flex items-center gap-3">
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cream-soft">
                  {hero.value.photo_url ? (
                    <img src={hero.value.photo_url} alt="Foto do Lucas" className="h-full w-full object-cover" />
                  ) : (
                    <span className="px-1 text-center text-[10px] text-ink-muted">Sem foto</span>
                  )}
                  {uploadingHeroPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-[10px] text-ink">
                      Enviando…
                    </div>
                  )}
                </div>
                <input
                  ref={heroPhotoInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleHeroPhotoUpload(file)
                    e.target.value = ''
                  }}
                />
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => heroPhotoInput.current?.click()}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink hover:bg-cream-soft"
                  >
                    {hero.value.photo_url ? 'Trocar foto' : 'Subir foto'}
                  </button>
                  {hero.value.photo_url && (
                    <button
                      type="button"
                      onClick={() => hero.setValue({ ...hero.value, photo_url: null })}
                      className="text-left text-xs font-medium text-danger hover:underline"
                    >
                      Remover foto
                    </button>
                  )}
                </div>
              </div>
              {heroPhotoError && <p className="mt-2 text-xs text-danger">{heroPhotoError}</p>}
              <p className="mt-2 text-xs text-ink-muted">
                Lembre de clicar em "Salvar seção" depois de subir ou remover a foto.
              </p>
            </div>

            <div>
              <span className="mb-1 block text-sm font-medium text-ink">Selos de confiança</span>
              <p className="mb-2 text-xs text-ink-muted">
                Os 3 itens com ícone que aparecem abaixo dos botões do topo do site (ex: "🛡️ Lacrados e
                seminovos originais").
              </p>
              <div className="space-y-2">
                {(hero.value.features ?? DEFAULT_FEATURES).map((feature, i) => {
                  const list = hero.value.features ?? DEFAULT_FEATURES
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={feature.icon}
                        onChange={(e) => {
                          const next = [...list]
                          next[i] = { ...next[i], icon: e.target.value }
                          hero.setValue({ ...hero.value, features: next })
                        }}
                        placeholder="🛡️"
                        className="w-12 shrink-0 rounded-lg border border-border px-2 py-2 text-center text-sm focus:border-terracotta focus:outline-none"
                      />
                      <input
                        value={feature.label}
                        onChange={(e) => {
                          const next = [...list]
                          next[i] = { ...next[i], label: e.target.value }
                          hero.setValue({ ...hero.value, features: next })
                        }}
                        placeholder="Texto do selo"
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = list.filter((_, idx) => idx !== i)
                          hero.setValue({ ...hero.value, features: next })
                        }}
                        className="shrink-0 rounded-lg border border-border px-2.5 py-2 text-xs font-medium text-danger hover:bg-danger/10"
                      >
                        Remover
                      </button>
                    </div>
                  )
                })}
              </div>
              {(hero.value.features ?? DEFAULT_FEATURES).length < 5 && (
                <button
                  type="button"
                  onClick={() =>
                    hero.setValue({
                      ...hero.value,
                      features: [...(hero.value.features ?? DEFAULT_FEATURES), { icon: '✨', label: '' }],
                    })
                  }
                  className="mt-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink hover:bg-cream-soft"
                >
                  + Adicionar selo
                </button>
              )}
            </div>

            <SaveBar saving={hero.saving} savedAt={hero.savedAt} error={hero.error} onSave={hero.save} />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-ink">Estatísticas (seção "Sobre nós")</h2>
        {stats.loading ? (
          <p className="mt-2 text-sm text-ink-muted">Carregando…</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Clientes" value={stats.value.clients} onChange={(v) => stats.setValue({ ...stats.value, clients: v })} />
            <Field label="Anos de experiência" value={stats.value.years} onChange={(v) => stats.setValue({ ...stats.value, years: v })} />
            <Field label="% lacrados" value={stats.value.sealed_pct} onChange={(v) => stats.setValue({ ...stats.value, sealed_pct: v })} />
            <Field label="Prazo de entrega" value={stats.value.delivery} onChange={(v) => stats.setValue({ ...stats.value, delivery: v })} />
            <div className="col-span-2">
              <SaveBar saving={stats.saving} savedAt={stats.savedAt} error={stats.error} onSave={stats.save} />
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-ink">Sobre nós (texto)</h2>
        {about.loading ? (
          <p className="mt-2 text-sm text-ink-muted">Carregando…</p>
        ) : (
          <div className="mt-3 space-y-3">
            <Field label="Título" value={about.value.title} onChange={(v) => about.setValue({ ...about.value, title: v })} multiline />
            <Field
              label="Parágrafo 1"
              value={about.value.paragraph1}
              onChange={(v) => about.setValue({ ...about.value, paragraph1: v })}
              multiline
            />
            <Field
              label="Parágrafo 2"
              value={about.value.paragraph2}
              onChange={(v) => about.setValue({ ...about.value, paragraph2: v })}
              multiline
            />
            <SaveBar saving={about.saving} savedAt={about.savedAt} error={about.error} onSave={about.save} />
          </div>
        )}
      </section>
    </div>
  )
}
