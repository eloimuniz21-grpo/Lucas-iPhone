import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ChartCard, EmptyState } from '../components/charts/ChartCard'
import { LineAreaChart, LineAreaTable, type DailyPoint } from '../components/charts/LineAreaChart'
import { ModelHeatmap, ModelHeatmapTable, type ModelCount } from '../components/charts/ModelHeatmap'
import { AgeBars, CityBars, DemographicsTable, GenderBar, type DemographicsInput } from '../components/charts/Demographics'
import { DateRangeFilter, rangeLabel, type DateRange } from '../components/charts/DateRangeFilter'
import { SessionsChart, SessionsTable, type SessionPoint } from '../components/charts/SessionsChart'
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

interface SiteEventRow {
  event_type: string
  created_at: string
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const integer = new Intl.NumberFormat('pt-BR')

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function isoDaysAgo(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function isoToUtcDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function addDaysIso(iso: string, days: number) {
  const d = isoToUtcDate(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Converte o filtro selecionado (preset ou personalizado) num intervalo
 * [start, end] de datas ISO, usado tanto na query quanto no preenchimento
 * da série. */
function rangeToWindow(range: DateRange): { start: string; end: string } {
  if (range.kind === 'preset') {
    return { start: isoDaysAgo(range.days - 1), end: todayIso() }
  }
  return { start: range.start, end: range.end }
}

/** Preenche os dias sem venda com zero, pra linha do tempo ficar contínua,
 * cobrindo qualquer intervalo (não só "últimos N dias terminando hoje"). */
function fillDailySeries(rows: DailyRow[], startIso: string, endIso: string): DailyPoint[] {
  const byDate = new Map(rows.map((r) => [r.sale_date, r]))
  const out: DailyPoint[] = []
  let cursor = startIso
  let guard = 0
  while (cursor <= endIso && guard < 3660) {
    const row = byDate.get(cursor)
    out.push({
      date: cursor,
      revenue: row ? Number(row.revenue) : 0,
      cost: row ? Number(row.cost) : 0,
      profit: row ? Number(row.profit) : 0,
    })
    cursor = addDaysIso(cursor, 1)
    guard++
  }
  return out
}

/** Agrega os eventos brutos (um por linha) em contagem diária de sessões e
 * cliques no WhatsApp, preenchendo os dias sem eventos com zero. */
function fillSessionsSeries(rows: SiteEventRow[], startIso: string, endIso: string): SessionPoint[] {
  const counts = new Map<string, { sessions: number; whatsapp_clicks: number }>()
  for (const row of rows) {
    const date = row.created_at.slice(0, 10)
    const entry = counts.get(date) ?? { sessions: 0, whatsapp_clicks: 0 }
    if (row.event_type === 'session_start') entry.sessions += 1
    else if (row.event_type === 'whatsapp_click') entry.whatsapp_clicks += 1
    counts.set(date, entry)
  }

  const out: SessionPoint[] = []
  let cursor = startIso
  let guard = 0
  while (cursor <= endIso && guard < 3660) {
    const entry = counts.get(cursor)
    out.push({ date: cursor, sessions: entry?.sessions ?? 0, whatsapp_clicks: entry?.whatsapp_clicks ?? 0 })
    cursor = addDaysIso(cursor, 1)
    guard++
  }
  return out
}

function firstDevice(device: RawSaleRow['device']) {
  if (!device) return null
  return Array.isArray(device) ? device[0] ?? null : device
}

export function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stockCount, setStockCount] = useState(0)
  const [monthRows, setMonthRows] = useState<DailyRow[]>([])
  const [dailySeries, setDailySeries] = useState<DailyPoint[]>([])
  const [modelCounts, setModelCounts] = useState<ModelCount[]>([])
  const [demographics, setDemographics] = useState<DemographicsInput[]>([])
  const [sessionSeries, setSessionSeries] = useState<SessionPoint[]>([])
  const [range, setRange] = useState<DateRange>({ kind: 'preset', days: 30, label: 'Últimos 30 dias' })

  useEffect(() => {
    let active = true
    const isFirstLoad = loading

    async function load() {
      try {
        if (!isFirstLoad) setRefreshing(true)

        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        const startIso = startOfMonth.toISOString().slice(0, 10)
        const { start: windowStartIso, end: windowEndIso } = rangeToWindow(range)

        const eventsStartIso = `${windowStartIso}T00:00:00.000Z`
        const eventsEndIso = `${addDaysIso(windowEndIso, 1)}T00:00:00.000Z`

        const [stockRes, monthFinancialsRes, windowFinancialsRes, rawSalesRes, siteEventsRes] = await Promise.all([
          supabase.from('devices').select('id', { count: 'exact', head: true }).eq('status', 'em_estoque'),
          supabase.from('daily_financials').select('*').gte('sale_date', startIso).order('sale_date'),
          supabase
            .from('daily_financials')
            .select('*')
            .gte('sale_date', windowStartIso)
            .lte('sale_date', windowEndIso)
            .order('sale_date'),
          supabase
            .from('sales')
            .select('sale_date, sale_price, client_gender, client_age, client_city, device:devices(model, cost_price)')
            .gte('sale_date', windowStartIso)
            .lte('sale_date', windowEndIso),
          supabase
            .from('site_events')
            .select('event_type, created_at')
            .gte('created_at', eventsStartIso)
            .lt('created_at', eventsEndIso),
        ])

        if (!active) return

        if (stockRes.error) throw stockRes.error
        if (monthFinancialsRes.error) throw monthFinancialsRes.error
        if (windowFinancialsRes.error) throw windowFinancialsRes.error
        if (rawSalesRes.error) throw rawSalesRes.error
        // site_events é best-effort: se a tabela ainda não tiver sido criada
        // (ou a query falhar por qualquer motivo), o resto do dashboard não
        // deve quebrar — só o card de sessões fica vazio.
        if (siteEventsRes.error) console.error('Falha ao carregar site_events:', siteEventsRes.error)

        setStockCount(stockRes.count ?? 0)
        setMonthRows((monthFinancialsRes.data ?? []) as DailyRow[])
        setDailySeries(fillDailySeries((windowFinancialsRes.data ?? []) as DailyRow[], windowStartIso, windowEndIso))

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

        setSessionSeries(
          fillSessionsSeries((siteEventsRes.data ?? []) as SiteEventRow[], windowStartIso, windowEndIso),
        )
      } catch (err) {
        console.error(err)
        if (active) setError('Não consegui carregar os números agora. Tenta recarregar a página.')
      } finally {
        if (active) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    load()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.kind === 'preset' ? `p${range.days}` : `c${range.start}_${range.end}`])

  const todayIsoValue = todayIso()
  const today = monthRows.find((r) => r.sale_date === todayIsoValue)
  const monthTotals = monthRows.reduce(
    (acc, r) => ({
      revenue: acc.revenue + Number(r.revenue),
      cost: acc.cost + Number(r.cost),
      profit: acc.profit + Number(r.profit),
      units: acc.units + Number(r.units_sold),
    }),
    { revenue: 0, cost: 0, profit: 0, units: 0 },
  )

  const sessionTotals = sessionSeries.reduce(
    (acc, s) => ({ sessions: acc.sessions + s.sessions, whatsapp_clicks: acc.whatsapp_clicks + s.whatsapp_clicks }),
    { sessions: 0, whatsapp_clicks: 0 },
  )
  const conversionRate = sessionTotals.sessions > 0 ? (sessionTotals.whatsapp_clicks / sessionTotals.sessions) * 100 : null
  const sessionsSubtitle = [
    `${integer.format(sessionTotals.sessions)} sessões`,
    `${integer.format(sessionTotals.whatsapp_clicks)} cliques no WhatsApp`,
    conversionRate !== null ? `conversão de ${conversionRate.toFixed(1)}%` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink sm:text-2xl">Visão geral</h1>
      <p className="mt-1 text-sm text-ink-muted">Resumo do mês e desempenho no período selecionado abaixo.</p>

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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">Gráficos</h2>
              <p className="text-xs text-ink-muted">O período abaixo filtra tudo nesta seção</p>
            </div>
            <div className="flex items-center gap-2">
              {refreshing && <span className="text-xs text-ink-muted">Atualizando…</span>}
              <DateRangeFilter value={range} onChange={setRange} />
            </div>
          </div>

          <div className={`space-y-6 transition-opacity duration-200 ${refreshing ? 'opacity-60' : 'opacity-100'}`}>
            <ChartCard
              title="Desempenho"
              subtitle={`Receita, custo e lucro — ${rangeLabel(range)}`}
              table={<LineAreaTable data={dailySeries} />}
            >
              <LineAreaChart data={dailySeries} />
            </ChartCard>

            <ChartCard
              title="Modelos mais vendidos"
              subtitle={`Unidades vendidas — ${rangeLabel(range)}`}
              table={<ModelHeatmapTable data={modelCounts} />}
            >
              <ModelHeatmap data={modelCounts} />
            </ChartCard>

            <ChartCard
              title="Sessões & cliques no WhatsApp"
              subtitle={sessionTotals.sessions === 0 ? `Sem dados de visita ainda — ${rangeLabel(range)}` : `${sessionsSubtitle} — ${rangeLabel(range)}`}
              table={<SessionsTable data={sessionSeries} />}
            >
              {sessionTotals.sessions === 0 ? (
                <EmptyState message="Ainda não há visitas registradas no site nesse período." />
              ) : (
                <SessionsChart data={sessionSeries} />
              )}
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
