import { useEffect, useRef, useState } from 'react'

export type DateRange =
  | { kind: 'preset'; days: number; label: string }
  | { kind: 'custom'; start: string; end: string }

const PRESETS: { label: string; days: number }[] = [
  { label: 'Hoje', days: 1 },
  { label: 'Últimos 7 dias', days: 7 },
  { label: 'Últimos 15 dias', days: 15 },
  { label: 'Últimos 30 dias', days: 30 },
  { label: 'Últimos 60 dias', days: 60 },
  { label: 'Últimos 90 dias', days: 90 },
]

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function rangeLabel(range: DateRange) {
  if (range.kind === 'preset') return range.label
  return `${formatBr(range.start)} – ${formatBr(range.end)}`
}

function formatBr(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

/** Filtro de intervalo de datas — uma linha, acima de todos os gráficos,
 * escopando tudo abaixo (regra da skill de dataviz: filtro nunca dentro de
 * um card de gráfico). Presets em lista + intervalo personalizado no rodapé. */
export function DateRangeFilter({ value, onChange }: { value: DateRange; onChange: (r: DateRange) => void }) {
  const [open, setOpen] = useState(false)
  const [customStart, setCustomStart] = useState(value.kind === 'custom' ? value.start : '')
  const [customEnd, setCustomEnd] = useState(value.kind === 'custom' ? value.end : todayIso())
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function pick(days: number, label: string) {
    onChange({ kind: 'preset', days, label })
    setOpen(false)
  }

  function applyCustom() {
    if (!customStart || !customEnd || customStart > customEnd) return
    onChange({ kind: 'custom', start: customStart, end: customEnd })
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-ink shadow-sm hover:border-ink/20"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink-muted" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path strokeLinecap="round" d="M8 3v4M16 3v4M3 10h18" />
        </svg>
        {rangeLabel(value)}
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-ink-muted" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-border bg-card p-1.5 shadow-lg">
          {PRESETS.map((p) => {
            const selected = value.kind === 'preset' && value.days === p.days
            return (
              <button
                key={p.days}
                type="button"
                onClick={() => pick(p.days, p.label)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-cream-soft"
              >
                {p.label}
                {selected && (
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-terracotta" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                  </svg>
                )}
              </button>
            )
          })}

          <div className="mt-1 border-t border-border pt-2">
            <p className="px-3 pb-1.5 text-xs font-medium text-ink-muted">Personalizado</p>
            <div className="flex items-center gap-1.5 px-2">
              <input
                type="date"
                value={customStart}
                max={customEnd || todayIso()}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full rounded-lg border border-border px-2 py-1.5 text-xs focus:border-terracotta focus:outline-none"
              />
              <span className="text-xs text-ink-muted">até</span>
              <input
                type="date"
                value={customEnd}
                min={customStart}
                max={todayIso()}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full rounded-lg border border-border px-2 py-1.5 text-xs focus:border-terracotta focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={applyCustom}
              disabled={!customStart || !customEnd || customStart > customEnd}
              className="mx-2 mb-1.5 mt-2 w-[calc(100%-16px)] rounded-lg bg-terracotta px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
