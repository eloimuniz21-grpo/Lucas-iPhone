import { useRef, useState } from 'react'
import { ChartTooltip, LegendRow, currency, currencyFull } from './ChartCard'

export interface DailyPoint {
  date: string // YYYY-MM-DD
  revenue: number
  cost: number
  profit: number
}

const SERIES = [
  { key: 'revenue' as const, label: 'Receita', color: 'var(--color-chart-receita)' },
  { key: 'cost' as const, label: 'Custo', color: 'var(--color-chart-custo)' },
  { key: 'profit' as const, label: 'Lucro', color: 'var(--color-chart-lucro)' },
]

const WIDTH = 760
const HEIGHT = 260
const PAD_LEFT = 72
const PAD_RIGHT = 62
const PAD_TOP = 16
const PAD_BOTTOM = 30

function niceCeil(value: number) {
  if (value <= 0) return 100
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
  const normalized = value / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}

function formatDateShort(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export function LineAreaChart({ data }: { data: DailyPoint[] }) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (data.length === 0) return null

  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM
  const maxRaw = Math.max(1, ...data.flatMap((d) => [d.revenue, d.cost, d.profit]))
  const maxVal = niceCeil(maxRaw * 1.15)

  const xAt = (i: number) => PAD_LEFT + (data.length === 1 ? plotWidth / 2 : (i / (data.length - 1)) * plotWidth)
  const yAt = (v: number) => PAD_TOP + plotHeight - (v / maxVal) * plotHeight

  function pathFor(key: 'revenue' | 'cost' | 'profit') {
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(d[key])}`).join(' ')
  }

  function areaFor(key: 'revenue' | 'cost' | 'profit') {
    const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(d[key])}`).join(' ')
    return `${line} L ${xAt(data.length - 1)} ${yAt(0)} L ${xAt(0)} ${yAt(0)} Z`
  }

  // Gridlines em números redondos (0, 1/4, 1/2, 3/4, máximo).
  const gridSteps = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxVal)

  // Rótulos do fim de cada linha — empurra os que colidem verticalmente.
  const endLabels = SERIES.map((s) => ({
    ...s,
    value: data[data.length - 1][s.key],
    y: yAt(data[data.length - 1][s.key]),
  })).sort((a, b) => a.y - b.y)
  const MIN_GAP = 14
  for (let i = 1; i < endLabels.length; i++) {
    if (endLabels[i].y - endLabels[i - 1].y < MIN_GAP) {
      endLabels[i].y = endLabels[i - 1].y + MIN_GAP
    }
  }

  // Ticks do eixo X — no máximo ~6, espaçados.
  const tickEvery = Math.max(1, Math.ceil(data.length / 6))
  const xTicks = data.filter((_, i) => i % tickEvery === 0 || i === data.length - 1)

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH
    const idx = Math.round(((relX - PAD_LEFT) / plotWidth) * (data.length - 1))
    setHoverIndex(Math.min(data.length - 1, Math.max(0, idx)))
  }

  const hovered = hoverIndex !== null ? data[hoverIndex] : null
  const tooltipLeft = hoverIndex !== null ? (xAt(hoverIndex) / WIDTH) * 100 : 0

  return (
    <div>
      <LegendRow items={SERIES.map((s) => ({ label: s.label, color: s.color, kind: 'line' }))} />

      <div className="relative mt-3">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full touch-none"
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIndex(null)}
        >
          {/* Gridlines */}
          {gridSteps.map((g) => (
            <g key={g}>
              <line
                x1={PAD_LEFT}
                x2={WIDTH - PAD_RIGHT}
                y1={yAt(g)}
                y2={yAt(g)}
                stroke="var(--color-chart-grid)"
                strokeWidth={1}
              />
              <text x={PAD_LEFT - 8} y={yAt(g) + 3} textAnchor="end" fontSize={10} fill="var(--color-chart-muted)">
                {currency.format(g)}
              </text>
            </g>
          ))}

          {/* Áreas (wash ~10%) */}
          {SERIES.map((s) => (
            <path key={s.key} d={areaFor(s.key)} fill={s.color} opacity={0.1} stroke="none" />
          ))}

          {/* Linhas */}
          {SERIES.map((s) => (
            <path
              key={s.key}
              d={pathFor(s.key)}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {/* Crosshair */}
          {hoverIndex !== null && (
            <line
              x1={xAt(hoverIndex)}
              x2={xAt(hoverIndex)}
              y1={PAD_TOP}
              y2={HEIGHT - PAD_BOTTOM}
              stroke="var(--color-chart-axis)"
              strokeWidth={1}
            />
          )}

          {/* Pontos finais + rótulo direto (valor no fim da linha) */}
          {SERIES.map((s) => {
            const lastVal = data[data.length - 1][s.key]
            return (
              <circle
                key={s.key}
                cx={xAt(data.length - 1)}
                cy={yAt(lastVal)}
                r={4}
                fill={s.color}
                stroke="var(--color-card)"
                strokeWidth={2}
              />
            )
          })}
          {endLabels.map((s) => (
            <text
              key={s.key}
              x={WIDTH - PAD_RIGHT + 4}
              y={s.y + 3}
              fontSize={10}
              fontWeight={600}
              fill="var(--color-ink)"
            >
              {currency.format(s.value)}
            </text>
          ))}

          {/* Ponto no hover, por série */}
          {hoverIndex !== null &&
            SERIES.map((s) => (
              <circle
                key={s.key}
                cx={xAt(hoverIndex)}
                cy={yAt(data[hoverIndex][s.key])}
                r={4}
                fill={s.color}
                stroke="var(--color-card)"
                strokeWidth={2}
              />
            ))}

          {/* Eixo X */}
          {xTicks.map((d) => {
            const i = data.indexOf(d)
            return (
              <text
                key={d.date}
                x={xAt(i)}
                y={HEIGHT - PAD_BOTTOM + 16}
                textAnchor="middle"
                fontSize={10}
                fill="var(--color-chart-muted)"
              >
                {formatDateShort(d.date)}
              </text>
            )
          })}
        </svg>

        {hovered && hoverIndex !== null && (
          <ChartTooltip x={`${tooltipLeft}%`} y={40}>
            <p className="font-semibold text-ink">{formatDateShort(hovered.date)}</p>
            <div className="mt-1 space-y-0.5">
              {SERIES.map((s) => (
                <div key={s.key} className="flex items-center gap-2">
                  <span className="inline-block h-0.5 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-ink-muted">{s.label}</span>
                  <span className="ml-auto font-semibold text-ink">{currencyFull.format(hovered[s.key])}</span>
                </div>
              ))}
            </div>
          </ChartTooltip>
        )}
      </div>
    </div>
  )
}

export function LineAreaTable({ data }: { data: DailyPoint[] }) {
  return (
    <div className="max-h-72 overflow-auto rounded-lg border border-border">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-cream-soft text-ink-muted">
          <tr>
            <th className="px-3 py-2 font-medium">Data</th>
            <th className="px-3 py-2 font-medium">Receita</th>
            <th className="px-3 py-2 font-medium">Custo</th>
            <th className="px-3 py-2 font-medium">Lucro</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date} className="border-t border-border">
              <td className="px-3 py-1.5 text-ink">{formatDateShort(d.date)}</td>
              <td className="px-3 py-1.5">{currencyFull.format(d.revenue)}</td>
              <td className="px-3 py-1.5">{currencyFull.format(d.cost)}</td>
              <td className="px-3 py-1.5">{currencyFull.format(d.profit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
