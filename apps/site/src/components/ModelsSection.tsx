import { useSiteModels } from '../lib/hooks'
import { getWhatsAppLink } from '../lib/whatsapp'
import { trackEvent } from '../lib/analytics'

const TAG_LABELS: Record<string, string> = {
  lançamento: 'Lançamento',
  'mais vendido': 'Mais vendido',
  'melhor custo': 'Melhor custo',
}

export function ModelsSection() {
  const { models, loading } = useSiteModels()

  return (
    <section id="modelos" className="border-t border-border bg-cream-soft/60">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-terracotta">
              Linhas disponíveis
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Selecionados a dedo.
            </h2>
          </div>
          <a
            href={getWhatsAppLink('Oi Lucas! Quero ver o estoque completo de iPhones. 📱') ?? '#'}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackEvent('whatsapp_click', { model: null, source: 'ver_estoque_completo' })}
            className="text-sm font-semibold text-terracotta-dark underline-offset-4 hover:underline"
          >
            Ver estoque completo →
          </a>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-cream-soft" />
            ))}

          {!loading && models.length === 0 && (
            <p className="text-sm text-ink-muted sm:col-span-2 lg:col-span-3">
              Modelos em destaque aparecerão aqui assim que forem cadastrados no painel.
            </p>
          )}

          {models.map((model) => (
            <article
              key={model.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="relative aspect-square w-full bg-gradient-to-br from-cream-soft to-white">
                {model.tag && (
                  <span className="absolute left-3 top-3 rounded-full bg-terracotta px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                    {TAG_LABELS[model.tag] ?? model.tag}
                  </span>
                )}
                {model.photo_url ? (
                  <img
                    src={model.photo_url}
                    alt={model.label}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-ink-muted">
                    Foto do aparelho
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                <h3 className="text-base font-semibold text-ink sm:text-lg">{model.label}</h3>
                <a
                  href={
                    getWhatsAppLink(`Oi Lucas! 📲 Tenho interesse no ${model.label}, ainda tem disponível?`) ??
                    '#'
                  }
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackEvent('whatsapp_click', { model: model.label, source: 'modelos' })}
                  className="mt-auto inline-flex items-center justify-center rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
                >
                  Consultar disponibilidade
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
