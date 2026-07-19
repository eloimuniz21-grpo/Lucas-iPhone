import { useRef, useState } from 'react'
import { ChartTooltip, EmptyState } from './ChartCard'

export interface ModelCount {
  model: string
  units: number
}

// Rampa sequencial (uma hue só, claro→escuro) validada pelo script da skill
// de dataviz — mesma rampa "blue" documentada em palette.md.
const SEQ_STEPS = [
  'var(--color-chart-seq-100)',
  'var(--color-chart-seq-200)',
  'var(--color-chart-seq-300)',
  'var(--color-chart-seq-400)',
  'var(--color-chart-seq-450)',
  'var(--color-chart-seq-500)',
  'var(--color-chart-seq-600)',
  'var(--color-chart-seq-700)',
]

function stepFor(fraction: number) {
  const idx = Math.min(SEQ_STEPS.length - 1, Math.round(fraction * (SEQ_STEPS.length - 1)))
  return { color: SEQ_STEPS[idx], light: idx < 4 }
}

export function ModelHeatmap({ data }: { data: ModelCount[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [tip, setTip] = useState<{ model: string; units: number; x: number; y: number } | null>(null)
  if (data.length === 0) return <EmptyState message="Nenhuma venda registrada nesse período ainda." />

  const sorted = [...data].sort((a, b) => b.units - a.units)
  const maxUnits = Math.max(...sorted.map((d) => d.units))

  function showTip(e: React.SyntheticEvent<HTMLDivElement>, d: ModelCount) {
    const cellRect = e.currentTarget.getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return
    setTip({
      model: d.model,
      units: d.units,
      x: cellRect.left - containerRect.left + cellRect.width / 2,
      y: cellRect.top - containerRect.top,
    })
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {sorted.map((d) => {
          const { color, light } = stepFor(maxUnits > 0 ? d.units / maxUnits : 0)
          return (
            <div
              key={d.model}
              tabIndex={0}
              onPointerEnter={(e) => showTip(e, d)}
              onPointerLeave={() => setTip((v) => (v?.model === d.model ? null : v))}
              onFocus={(e) => showTip(e, d)}
              onBlur={() => setTip((v) => (v?.model === d.model ? null : v))}
              className="flex aspect-square flex-col items-center justify-center rounded-xl p-2 text-center outline-none ring-terracotta focus-visible:ring-2"
              style={{ backgroundColor: color }}
            >
              <span className={`text-lg font-bold ${light ? 'text-ink' : 'text-white'}`}>{d.units}</span>
              <span className={`mt-1 text-[10px] leading-tight ${light ? 'text-ink/80' : 'text-white/85'}`}>
                {d.model}
              </span>
            </div>
          )
        })}
      </div>

      {tip && (
        <ChartTooltip x={tip.x} y={tip.y}>
          <p className="font-semibold text-ink">{tip.model}</p>
          <p className="text-ink-muted">{tip.units} unidades vendidas</p>
        </ChartTooltip>
      )}

      <p className="mt-3 text-[10px] text-ink-muted">Cor mais escura = mais unidades vendidas no período.</p>
    </div>
  )
}

export function ModelHeatmapTable({ data }: { data: ModelCount[] }) {
  const sorted = [...data].sort((a, b) => b.units - a.units)
  return (
    <div className="max-h-72 overflow-auto rounded-lg border border-border">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-cream-soft text-ink-muted">
          <tr>
            <th className="px-3 py-2 font-medium">Modelo</th>
            <th className="px-3 py-2 font-medium">Unidades vendidas</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((d) => (
            <tr key={d.model} className="border-t border-border">
              <td className="px-3 py-1.5 text-ink">{d.model}</td>
              <td className="px-3 py-1.5">{d.units}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
