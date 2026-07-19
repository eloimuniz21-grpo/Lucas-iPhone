import { useEffect, useRef, useState } from 'react'
import { useSiteModels } from '../lib/hooks'
import { getWhatsAppLink } from '../lib/whatsapp'
import { trackEvent } from '../lib/analytics'

export function ModelsSection() {
  const { models, loading } = useSiteModels()
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(true)

  function updateEdges() {
    const el = scrollRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 4)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4)
  }

  useEffect(() => {
    updateEdges()
    window.addEventListener('resize', updateEdges)
    return () => window.removeEventListener('resize', updateEdges)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [models, loading])

  function scrollByPage(direction: 1 | -1) {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'smooth' })
  }

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

          <div className="flex items-center gap-4">
            {models.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Ver modelos anteriores"
                  onClick={() => scrollByPage(-1)}
                  disabled={atStart}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-ink transition-colors hover:border-ink/30 disabled:opacity-30"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Ver mais modelos"
                  onClick={() => scrollByPage(1)}
                  disabled={atEnd}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-ink transition-colors hover:border-ink/30 disabled:opacity-30"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
            )}
            <a
              href={getWhatsAppLink('Oi Lucas! Quero ver o estoque completo de iPhones. 📱') ?? '#'}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackEvent('whatsapp_click', { model: null, source: 'ver_estoque_completo' })}
              className="shrink-0 text-sm font-semibold text-terracotta-dark underline-offset-4 hover:underline"
            >
              Ver estoque completo →
            </a>
          </div>
        </div>

        {!loading && models.length === 0 && (
          <p className="mt-8 text-sm text-ink-muted">
            Modelos em destaque aparecerão aqui assim que forem cadastrados no painel.
          </p>
        )}

        {/* Trilho horizontal em vez de grade — evita que a seção cresça
         * verticalmente sem fim conforme mais modelos são cadastrados.
         * Scroll nativo (arrasta/roda no touch) + setas de apoio no
         * cabeçalho; barra de rolagem nativa escondida por estética. */}
        <div
          ref={scrollRef}
          onScroll={updateEdges}
          className="mt-8 flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-80 w-64 shrink-0 animate-pulse rounded-2xl bg-cream-soft sm:w-72" />
            ))}

          {models.map((model) => (
            <article
              key={model.id}
              className="flex w-64 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:w-72"
            >
              <div className="relative aspect-square w-full bg-gradient-to-br from-cream-soft to-white">
                {model.tag && (
                  <span className="absolute left-3 top-3 rounded-full bg-terracotta px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                    {model.tag}
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
