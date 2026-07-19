import { useRef, useState } from 'react'
import { ChartTooltip, LegendRow } from './ChartCard'

export interface SessionPoint {
  date: string // YYYY-MM-DD
  sessions: number
  whatsapp_clicks: number
}

const integer = new Intl.NumberFormat('pt-BR')

const SERIES = [
  { key: 'sessions' as const, label: 'Sessões', color: 'var(--color-chart-receita)' },
  { key: 'whatsapp_clicks' as const, label: 'Cliques no WhatsApp', color: 'var(--color-chart-lucro)' },
]

const WIDTH = 760
const HEIGHT = 220
const PAD_LEFT = 40
const PAD_RIGHT = 20
const PAD_TOP = 16
const PAD_BOTTOM = 30

function niceCeil(value: number) {
  if (value <= 0) return 5
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
  const normalized = value / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}

function formatDateShort(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

/** Mesma curva Catmull-Rom → Bézier do LineAreaChart — repetida aqui de
 * propósito (cada gráfico deste dashboard é autocontido, sem acoplamento
 * entre componentes de visualização diferentes). */
function smoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`
  }
  return d
}

export function SessionsChart({ data }: { data: SessionPoint[] }) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (data.length === 0) return null

  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM
  const maxRaw = Math.max(1, ...data.flatMap((d) => [d.sessions, d.whatsapp_clicks]))
  const maxVal = niceCeil(maxRaw * 1.15)

  const xAt = (i: number) => PAD_LEFT + (data.length === 1 ? plotWidth / 2 : (i / (data.length - 1)) * plotWidth)
  const yAt = (v: number) => PAD_TOP + plotHeight - (v / maxVal) * plotHeight

  function pointsFor(key: 'sessions' | 'whatsapp_clicks') {
    return data.map((d, i) => ({ x: xAt(i), y: yAt(d[key]) }))
  }

  const gridSteps = [0, 0.5, 1].map((f) => f * maxVal)
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
                {integer.format(g)}
              </text>
            </g>
          ))}

          {SERIES.map((s) => (
            <path
              key={s.key}
              d={smoothPath(pointsFor(s.key))}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

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

          {SERIES.map((s) => (
            <circle
              key={s.key}
              cx={xAt(data.length - 1)}
              cy={yAt(data[data.length - 1][s.key])}
              r={4}
              fill={s.color}
              stroke="var(--color-card)"
              strokeWidth={2}
            />
          ))}

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
          <ChartTooltip x={`${tooltipLeft}%`} y={36}>
            <p className="font-semibold text-ink">{formatDateShort(hovered.date)}</p>
            <div className="mt-1 space-y-0.5">
              {SERIES.map((s) => (
                <div key={s.key} className="flex items-center gap-2">
                  <span className="inline-block h-0.5 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-ink-muted">{s.label}</span>
                  <span className="ml-auto font-semibold text-ink">{integer.format(hovered[s.key])}</span>
                </div>
              ))}
            </div>
          </ChartTooltip>
        )}
      </div>
    </div>
  )
}

export function SessionsTable({ data }: { data: SessionPoint[] }) {
  return (
    <div className="max-h-72 overflow-auto rounded-lg border border-border">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-cream-soft text-ink-muted">
          <tr>
            <th className="px-3 py-2 font-medium">Data</th>
            <th className="px-3 py-2 font-medium">Sessões</th>
            <th className="px-3 py-2 font-medium">Cliques no WhatsApp</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date} className="border-t border-border">
              <td className="px-3 py-1.5 text-ink">{formatDateShort(d.date)}</td>
              <td className="px-3 py-1.5">{integer.format(d.sessions)}</td>
              <td className="px-3 py-1.5">{integer.format(d.whatsapp_clicks)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
