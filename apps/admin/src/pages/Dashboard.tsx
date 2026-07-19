import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ChartCard } from '../components/charts/ChartCard'
import { LineAreaChart, LineAreaTable, type DailyPoint } from '../components/charts/LineAreaChart'
import { ModelHeatmap, ModelHeatmapTable, type ModelCount } from '../components/charts/ModelHeatmap'
import { AgeBars, CityBars, DemographicsTable, GenderBar, type DemographicsInput } from '../components/charts/Demographics'
import type { ClientGender } from '../lib/types'

interface DailyRow {
  sale_date: string
  revenue: number
  cost: number
  profit: number
  units_sold: number
}

interface RawSaleRow {
  sale_date: string
  sale_price: number
  client_gender: ClientGender | null
  client_age: number | null
  client_city: string | null
  device: { model: string; cost_price: number } | { model: string; cost_price: number }[] | null
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const WINDOW_DAYS = 30

function isoDaysAgo(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

/** Preenche os dias sem venda com zero, pra linha do tempo ficar contínua. */
function fillDailySeries(rows: DailyRow[], days: number): DailyPoint[] {
  const byDate = new Map(rows.map((r) => [r.sale_date, r]))
  const out: DailyPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = isoDaysAgo(i)
    const row = byDate.get(date)
    out.push({
      date,
      revenue: row ? Number(row.revenue) : 0,
      cost: row ? Number(row.cost) : 0,
      profit: row ? Number(row.profit) : 0,
    })
  }
  return out
}

function firstDevice(device: RawSaleRow['device']) {
  if (!device) return null
  return Array.isArray(device) ? device[0] ?? null : device
}

export function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stockCount, setStockCount] = useState(0)
  const [monthRows, setMonthRows] = useState<DailyRow[]>([])
  const [dailySeries, setDailySeries] = useState<DailyPoint[]>([])
  const [modelCounts, setModelCounts] = useState<ModelCount[]>([])
  const [demographics, setDemographics] = useState<DemographicsInput[]>([])

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        const startIso = startOfMonth.toISOString().slice(0, 10)
        const windowStartIso = isoDaysAgo(WINDOW_DAYS - 1)

        const [stockRes, monthFinancialsRes, windowFinancialsRes, rawSalesRes] = await Promise.all([
          supabase.from('devices').select('id', { count: 'exact', head: true }).eq('status', 'em_estoque'),
          supabase.from('daily_financials').select('*').gte('sale_date', startIso).order('sale_date'),
          supabase.from('daily_financials').select('*').gte('sale_date', windowStartIso).order('sale_date'),
          supabase
            .from('sales')
            .select('sale_date, sale_price, client_gender, client_age, client_city, device:devices(model, cost_price)')
            .gte('sale_date', windowStartIso),
        ])

        if (!active) return

        if (stockRes.error) throw stockRes.error
        if (monthFinancialsRes.error) throw monthFinancialsRes.error
        if (windowFinancialsRes.error) throw windowFinancialsRes.error
        if (rawSalesRes.error) throw rawSalesRes.error

        setStockCount(stockRes.count ?? 0)
        setMonthRows((monthFinancialsRes.data ?? []) as DailyRow[])
        setDailySeries(fillDailySeries((windowFinancialsRes.data ?? []) as DailyRow[], WINDOW_DAYS))

        const rawSales = (rawSalesRes.data ?? []) as RawSaleRow[]

        const modelMap = new Map<string, number>()
        for (const s of rawSales) {
          const device = firstDevice(s.device)
          if (!device) continue
          modelMap.set(device.model, (modelMap.get(device.model) ?? 0) + 1)
        }
        setModelCounts([...modelMap.entries()].map(([model, units]) => ({ model, units })))

        setDemographics(
          rawSales.map((s) => ({ gender: s.client_gender, age: s.client_age, city: s.client_city })),
        )
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
      <p className="mt-1 text-sm text-ink-muted">Resumo do mês e desempenho dos últimos {WINDOW_DAYS} dias.</p>

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

      {!loading && (
        <div className="mt-6 space-y-6">
          <ChartCard
            title={`Desempenho — últimos ${WINDOW_DAYS} dias`}
            subtitle="Receita, custo e lucro por dia"
            table={<LineAreaTable data={dailySeries} />}
          >
            <LineAreaChart data={dailySeries} />
          </ChartCard>

          <ChartCard
            title="Modelos mais vendidos"
            subtitle={`Unidades vendidas nos últimos ${WINDOW_DAYS} dias`}
            table={<ModelHeatmapTable data={modelCounts} />}
          >
            <ModelHeatmap data={modelCounts} />
          </ChartCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ChartCard title="Sexo" table={<DemographicsTable rows={demographics} />}>
              <GenderBar rows={demographics} />
            </ChartCard>
            <ChartCard title="Idade" table={<DemographicsTable rows={demographics} />}>
              <AgeBars rows={demographics} />
            </ChartCard>
            <ChartCard title="Localidade" table={<DemographicsTable rows={demographics} />}>
              <CityBars rows={demographics} />
            </ChartCard>
          </div>
        </div>
      )}
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
