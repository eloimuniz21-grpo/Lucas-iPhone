import { useMemo } from 'react'
import { useAvailableDevices, useTrackOnceVisible } from '../lib/hooks'
import { getWhatsAppLink } from '../lib/whatsapp'
import { trackEvent } from '../lib/analytics'
import type { AvailableDevice } from '../lib/types'

const CONDITION_LABELS: Record<string, string> = {
  lacrado: 'Lacrado',
  seminovo: 'Seminovo',
}

interface ModelGroup {
  model: string
  count: number
  storageOptions: number[]
  conditions: string[]
  photo_url: string | null
}

function groupByModel(devices: AvailableDevice[]): ModelGroup[] {
  const map = new Map<string, ModelGroup>()
  for (const d of devices) {
    const existing = map.get(d.model)
    if (existing) {
      existing.count += 1
      if (d.storage_gb && !existing.storageOptions.includes(d.storage_gb)) existing.storageOptions.push(d.storage_gb)
      if (d.condition && !existing.conditions.includes(d.condition)) existing.conditions.push(d.condition)
      if (!existing.photo_url && d.photo_url) existing.photo_url = d.photo_url
    } else {
      map.set(d.model, {
        model: d.model,
        count: 1,
        storageOptions: d.storage_gb ? [d.storage_gb] : [],
        conditions: d.condition ? [d.condition] : [],
        photo_url: d.photo_url,
      })
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.model.localeCompare(b.model))
}

export function StockSection() {
  const { devices, loading } = useAvailableDevices()
  const sectionRef = useTrackOnceVisible<HTMLElement>('stock_view')
  const groups = useMemo(() => groupByModel(devices), [devices])

  return (
    <section id="estoque" ref={sectionRef} className="border-t border-border bg-cream">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-terracotta">Estoque real</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          O que tem disponível agora.
        </h2>
        <p className="mt-3 max-w-xl text-sm text-ink-muted sm:text-base">
          Aparelhos já conferidos e prontos pra sair — sem preço fixo aqui porque cada condição
          muda o valor; a gente combina certinho no WhatsApp. 😉
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-cream-soft" />
            ))}

          {!loading && groups.length === 0 && (
            <p className="text-sm text-ink-muted sm:col-span-2 lg:col-span-3">
              Estoque em reposição no momento — chama no WhatsApp que a gente te avisa assim que
              chegar novidade. 📲
            </p>
          )}

          {groups.map((group) => {
            const waLink = getWhatsAppLink(
              `Oi Lucas! 👋 Vi que você tem ${group.model} disponível no site, ainda dá pra garantir? 📱`,
            )
            return (
              <article
                key={group.model}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cream-soft">
                    {group.photo_url ? (
                      <img src={group.photo_url} alt={group.model} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl" aria-hidden>
                        📱
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-ink">{group.model}</h3>
                      <span className="shrink-0 rounded-full bg-terracotta-light px-2 py-0.5 text-[10px] font-bold uppercase text-terracotta-dark">
                        {group.count} {group.count === 1 ? 'disponível' : 'disponíveis'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-ink-muted">
                      {[
                        group.storageOptions.sort((a, b) => a - b).map((gb) => `${gb}GB`).join(' · '),
                        group.conditions.map((c) => CONDITION_LABELS[c] ?? c).join(' · '),
                      ]
                        .filter(Boolean)
                        .join(' — ')}
                    </p>
                  </div>
                </div>

                <a
                  href={waLink ?? '#'}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackEvent('whatsapp_click', { model: group.model, source: 'estoque' })}
                  className="shrink-0 rounded-full bg-ink px-4 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-ink/90 sm:w-auto"
                >
                  Consultar
                </a>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
