import { useState, type ReactNode } from 'react'

/**
 * Moldura padrão de todo gráfico do dashboard: título, legenda/skeleton fica
 * a cargo de quem chama, mas o toggle "Ver tabela" (o par de acessibilidade
 * de todo gráfico, por regra da skill de dataviz) mora aqui, único lugar.
 */
export function ChartCard({
  title,
  subtitle,
  table,
  children,
}: {
  title: string
  subtitle?: string
  table: ReactNode
  children: ReactNode
}) {
  const [showTable, setShowTable] = useState(false)

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="shrink-0 rounded-full border border-border px-3 py-1 text-[11px] font-medium text-ink-muted hover:bg-cream-soft"
        >
          {showTable ? 'Ver gráfico' : 'Ver tabela'}
        </button>
      </div>
      <div className="mt-4">{showTable ? table : children}</div>
    </div>
  )
}

/** Tooltip flutuante simples, posicionado perto do ponteiro. */
export function ChartTooltip({
  x,
  y,
  children,
}: {
  x: number | string
  y: number
  children: ReactNode
}) {
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-md"
      style={{ left: x, top: y - 10 }}
    >
      {children}
    </div>
  )
}

export function LegendRow({
  items,
}: {
  items: { label: string; color: string; kind?: 'line' | 'swatch' }[]
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5 text-xs text-ink-muted">
          {item.kind === 'line' ? (
            <span className="inline-block h-0.5 w-4 rounded-full" style={{ backgroundColor: item.color }} />
          ) : (
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
          )}
          {item.label}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-ink-muted">
      {message}
    </div>
  )
}

export const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
export const currencyFull = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
