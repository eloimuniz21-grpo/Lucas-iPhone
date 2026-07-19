import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { AboutContent, HeroContent, StatsContent } from '../../lib/types'

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

const heroFallback: HeroContent = { badge: '', title: '', subtitle: '', clients_badge: '' }
const statsFallback: StatsContent = { clients: '', years: '', sealed_pct: '', delivery: '' }
const aboutFallback: AboutContent = { title: '', paragraph1: '', paragraph2: '' }

export function TextosTab() {
  const hero = useContentSection('hero', heroFallback)
  const stats = useContentSection('stats', statsFallback)
  const about = useContentSection('about', aboutFallback)

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
