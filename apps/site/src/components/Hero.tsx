import { useHeroContent } from '../lib/hooks'
import { getWhatsAppLink } from '../lib/whatsapp'

export function Hero() {
  const { content } = useHeroContent()
  const waLink = getWhatsAppLink('Oi Lucas! Vi seu site e queria consultar disponibilidade de um iPhone.')

  return (
    <section className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:px-8 lg:pb-24 lg:pt-16">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Texto — vem primeiro no mobile e no desktop (ordem natural) */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-terracotta-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-terracotta-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
            {content.badge}
          </span>

          <h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            {content.title}
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
            {content.subtitle}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={waLink ?? '#'}
              target={waLink ? '_blank' : undefined}
              rel={waLink ? 'noreferrer' : undefined}
              aria-disabled={!waLink}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-terracotta px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-transform active:scale-[0.98] sm:hover:bg-terracotta-dark"
            >
              Consultar disponibilidade
            </a>
            <a
              href="#modelos"
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-white px-6 py-3.5 text-sm font-semibold text-ink transition-colors sm:hover:border-ink/20"
            >
              Ver modelos
              <span aria-hidden>→</span>
            </a>
          </div>

          <dl className="mt-8 grid grid-cols-1 gap-3 text-xs text-ink-muted sm:grid-cols-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <span aria-hidden>🛡️</span> Lacrados e seminovos originais
            </div>
            <div className="flex items-center gap-2">
              <span aria-hidden>🧾</span> Nota fiscal
            </div>
            <div className="flex items-center gap-2">
              <span aria-hidden>🚚</span> Entrega em mãos
            </div>
          </dl>
        </div>

        {/* Imagem / social proof */}
        <div className="relative">
          <div className="aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-br from-terracotta-light to-cream-soft shadow-lg sm:mx-auto lg:mx-0 lg:max-w-none">
            <div className="flex h-full w-full items-center justify-center text-ink-muted">
              <span className="text-sm">Foto do Lucas aqui</span>
            </div>
          </div>

          <div className="absolute -bottom-5 left-4 rounded-2xl bg-white px-4 py-3 shadow-md sm:left-6">
            <p className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">
              Contando com a confiança de
            </p>
            <p className="text-base font-semibold text-ink">{content.clients_badge}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
