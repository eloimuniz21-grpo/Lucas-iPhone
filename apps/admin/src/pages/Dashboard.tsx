import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface DailyRow {
  sale_date: string
  revenue: number
  cost: number
  profit: number
  units_sold: number
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stockCount, setStockCount] = useState(0)
  const [monthRows, setMonthRows] = useState<DailyRow[]>([])

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        const startIso = startOfMonth.toISOString().slice(0, 10)

        const [stockRes, financialsRes] = await Promise.all([
          supabase.from('devices').select('id', { count: 'exact', head: true }).eq('status', 'em_estoque'),
          supabase.from('daily_financials').select('*').gte('sale_date', startIso).order('sale_date'),
        ])

        if (!active) return

        if (stockRes.error) throw stockRes.error
        if (financialsRes.error) throw financialsRes.error

        setStockCount(stockRes.count ?? 0)
        setMonthRows((financialsRes.data ?? []) as DailyRow[])
      } catch (err) {
        console.error(err)
        if (active) setError('Não consegui carregar os números agora. Tenta recarregar a página.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const todayIso = new Date().toISOString().slice(0, 10)
  const today = monthRows.find((r) => r.sale_date === todayIso)
  const monthTotals = monthRows.reduce(
    (acc, r) => ({
      revenue: acc.revenue + Number(r.revenue),
      cost: acc.cost + Number(r.cost),
      profit: acc.profit + Number(r.profit),
      units: acc.units + Number(r.units_sold),
    }),
    { revenue: 0, cost: 0, profit: 0, units: 0 },
  )

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink sm:text-2xl">Visão geral</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Resumo rápido. Os gráficos completos (linha do tempo, mapa de calor por modelo, perfil de
        clientes) entram numa próxima fase.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <KpiCard label="Em estoque" value={loading ? '—' : String(stockCount)} />
        <KpiCard label="Vendidos no mês" value={loading ? '—' : String(monthTotals.units)} />
        <KpiCard
          label="Receita no mês"
          value={loading ? '—' : currency.format(monthTotals.revenue)}
        />
        <KpiCard
          label="Lucro no mês"
          value={loading ? '—' : currency.format(monthTotals.profit)}
          accent
        />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-ink">Hoje</h2>
        {loading ? (
          <p className="mt-2 text-sm text-ink-muted">Carregando…</p>
        ) : today ? (
          <dl className="mt-3 grid grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-ink-muted">Receita</dt>
              <dd className="font-semibold text-ink">{currency.format(Number(today.revenue))}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Custo</dt>
              <dd className="font-semibold text-ink">{currency.format(Number(today.cost))}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Lucro</dt>
              <dd className="font-semibold text-terracotta-dark">
                {currency.format(Number(today.profit))}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">Nenhuma venda registrada hoje ainda.</p>
        )}
      </div>
    </div>
  )
}

function KpiCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className={`text-xl font-bold sm:text-2xl ${accent ? 'text-terracotta' : 'text-ink'}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-muted">{label}</p>
    </div>
  )
}
