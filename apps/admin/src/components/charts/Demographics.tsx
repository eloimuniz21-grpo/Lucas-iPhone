import { useState } from 'react'
import { ChartTooltip, EmptyState, LegendRow } from './ChartCard'
import type { ClientGender } from '../../lib/types'

export interface DemographicsInput {
  gender: ClientGender | null
  age: number | null
  city: string | null
}

const GENDER_LABEL: Record<ClientGender, string> = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  nao_informado: 'Não informado',
}

// Masculino/feminino formam o par categórico validado (terracotta ↔ blue,
// ΔE 24.7 protan / 26.1 dark — ver validate_palette.js). "Não informado" é
// um balde de contexto/"outros", por isso cinza neutro em vez de competir
// pela identidade das outras duas fatias.
const GENDER_COLOR: Record<ClientGender, string> = {
  masculino: 'var(--color-chart-lucro)',
  feminino: 'var(--color-chart-receita)',
  nao_informado: 'var(--color-chart-custo)',
}

// ---------------------------------------------------------------------------
// Sexo — barra empilhada horizontal (part-to-whole).
// ---------------------------------------------------------------------------
export function GenderBar({ rows }: { rows: DemographicsInput[] }) {
  const [hoverKey, setHoverKey] = useState<ClientGender | null>(null)
  const total = rows.length
  if (total === 0) return <EmptyState message="Nenhuma venda registrada ainda." />

  const counts: Record<ClientGender, number> = { masculino: 0, feminino: 0, nao_informado: 0 }
  for (const r of rows) counts[r.gender ?? 'nao_informado']++

  const order: ClientGender[] = ['masculino', 'feminino', 'nao_informado']
  const segments = order.map((g) => ({ gender: g, count: counts[g], pct: (counts[g] / total) * 100 })).filter((s) => s.count > 0)

  return (
    <div>
      <LegendRow items={order.filter((g) => counts[g] > 0).map((g) => ({ label: GENDER_LABEL[g], color: GENDER_COLOR[g] }))} />

      <div className="relative mt-3 flex h-6 w-full overflow-hidden rounded-full">
        {segments.map((s, i) => (
          <div
            key={s.gender}
            tabIndex={0}
            onPointerEnter={() => setHoverKey(s.gender)}
            onPointerLeave={() => setHoverKey((v) => (v === s.gender ? null : v))}
            onFocus={() => setHoverKey(s.gender)}
            onBlur={() => setHoverKey((v) => (v === s.gender ? null : v))}
            className="flex items-center justify-center outline-none"
            style={{
              width: `${s.pct}%`,
              backgroundColor: GENDER_COLOR[s.gender],
              marginLeft: i === 0 ? 0 : 2,
            }}
          >
            {s.pct >= 14 && (
              <span className="px-1 text-[11px] font-semibold text-white">{Math.round(s.pct)}%</span>
            )}
          </div>
        ))}
      </div>

      {hoverKey && (
        <div className="relative">
          <ChartTooltip x="50%" y={-8}>
            <p className="font-semibold text-ink">{GENDER_LABEL[hoverKey]}</p>
            <p className="text-ink-muted">
              {counts[hoverKey]} de {total} vendas ({Math.round((counts[hoverKey] / total) * 100)}%)
            </p>
          </ChartTooltip>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Idade — barras por faixa etária. Ordinal: uma hue só, degrade claro→escuro
// acompanhando a posição da faixa (não o valor/contagem).
// ---------------------------------------------------------------------------
const AGE_BRACKETS = [
  { label: '18-24', min: 18, max: 24 },
  { label: '25-34', min: 25, max: 34 },
  { label: '35-44', min: 35, max: 44 },
  { label: '45-54', min: 45, max: 54 },
  { label: '55+', min: 55, max: 999 },
]

const AGE_ORDINAL_STEPS = [
  'var(--color-chart-seq-200)',
  'var(--color-chart-seq-300)',
  'var(--color-chart-seq-450)',
  'var(--color-chart-seq-600)',
  'var(--color-chart-seq-700)',
]

export function AgeBars({ rows }: { rows: DemographicsInput[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const known = rows.filter((r) => r.age !== null) as { age: number }[]
  if (known.length === 0) return <EmptyState message="Nenhuma venda com idade informada ainda." />

  const counts = AGE_BRACKETS.map((b) => known.filter((r) => r.age >= b.min && r.age <= b.max).length)
  const maxCount = Math.max(1, ...counts)
  const BAR_MAX_H = 96

  return (
    <div>
      <div className="flex items-end justify-between gap-3" style={{ height: BAR_MAX_H + 24 }}>
        {AGE_BRACKETS.map((b, i) => {
          const h = counts[i] === 0 ? 0 : Math.max(6, (counts[i] / maxCount) * BAR_MAX_H)
          return (
            <div key={b.label} className="flex flex-1 flex-col items-center justify-end">
              {counts[i] > 0 && <span className="mb-1 text-[11px] font-semibold text-ink">{counts[i]}</span>}
              <div
                tabIndex={0}
                onPointerEnter={() => setHoverIdx(i)}
                onPointerLeave={() => setHoverIdx((v) => (v === i ? null : v))}
                onFocus={() => setHoverIdx(i)}
                onBlur={() => setHoverIdx((v) => (v === i ? null : v))}
                className="w-full max-w-6 rounded-t-[4px] outline-none"
                style={{ height: h, backgroundColor: AGE_ORDINAL_STEPS[i] }}
              />
              <span className="mt-1.5 text-[10px] text-ink-muted">{b.label}</span>
            </div>
          )
        })}
      </div>
      {hoverIdx !== null && counts[hoverIdx] > 0 && (
        <p className="mt-1 text-center text-[11px] text-ink-muted">
          {counts[hoverIdx]} cliente{counts[hoverIdx] > 1 ? 's' : ''} de {AGE_BRACKETS[hoverIdx].label} anos
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Localidade — top cidades. Magnitude, não identidade: todas as barras na
// mesma hue (nunca uma cor por barra).
// ---------------------------------------------------------------------------
export function CityBars({ rows }: { rows: DemographicsInput[] }) {
  const [hoverCity, setHoverCity] = useState<string | null>(null)
  const known = rows.filter((r) => r.city) as { city: string }[]
  if (known.length === 0) return <EmptyState message="Nenhuma venda com cidade informada ainda." />

  const counts = new Map<string, number>()
  for (const r of known) counts.set(r.city, (counts.get(r.city) ?? 0) + 1)
  const sorted = [...counts.entries()].map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count).slice(0, 6)
  const maxCount = Math.max(...sorted.map((s) => s.count))

  return (
    <div className="space-y-2">
      {sorted.map((s) => (
        <div
          key={s.city}
          tabIndex={0}
          onPointerEnter={() => setHoverCity(s.city)}
          onPointerLeave={() => setHoverCity((v) => (v === s.city ? null : v))}
          onFocus={() => setHoverCity(s.city)}
          onBlur={() => setHoverCity((v) => (v === s.city ? null : v))}
          className="flex items-center gap-2 outline-none"
        >
          <span className="w-32 shrink-0 truncate text-xs text-ink-muted">{s.city}</span>
          <div className="h-6 flex-1 overflow-hidden rounded-full bg-cream-soft">
            <div
              className="flex h-full items-center justify-end rounded-full px-2"
              style={{ width: `${Math.max(6, (s.count / maxCount) * 100)}%`, backgroundColor: 'var(--color-chart-seq-450)' }}
            >
              <span className="text-[11px] font-semibold text-white">{s.count}</span>
            </div>
          </div>
        </div>
      ))}
      {hoverCity && (
        <p className="text-[11px] text-ink-muted">
          {hoverCity}: {counts.get(hoverCity)} venda{(counts.get(hoverCity) ?? 0) > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}

export function DemographicsTable({ rows }: { rows: DemographicsInput[] }) {
  return (
    <div className="max-h-72 overflow-auto rounded-lg border border-border">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-cream-soft text-ink-muted">
          <tr>
            <th className="px-3 py-2 font-medium">Sexo</th>
            <th className="px-3 py-2 font-medium">Idade</th>
            <th className="px-3 py-2 font-medium">Cidade</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">
              <td className="px-3 py-1.5 text-ink">{GENDER_LABEL[r.gender ?? 'nao_informado']}</td>
              <td className="px-3 py-1.5">{r.age ?? '—'}</td>
              <td className="px-3 py-1.5">{r.city ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
