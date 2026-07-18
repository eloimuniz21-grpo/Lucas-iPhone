import { useTestimonials } from '../lib/hooks'
import { getWhatsAppLink } from '../lib/whatsapp'

export function TestimonialsSection() {
  const { testimonials, loading } = useTestimonials()

  // Enquanto não há depoimentos publicados, a seção some — melhor do que
  // mostrar um bloco vazio ou um depoimento fictício.
  if (!loading && testimonials.length === 0) return null

  return (
    <section id="depoimentos" className="border-t border-border bg-cream-soft/60">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-terracotta">Depoimentos</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          O que dizem os clientes
        </h2>
        <p className="mt-3 max-w-xl text-sm text-ink-muted sm:text-base">
          Vendas realizadas com foco na experiência do início ao fim — não só no dispositivo.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <blockquote className="text-sm italic leading-relaxed text-ink sm:text-base">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-terracotta-light text-sm font-semibold text-terracotta-dark">
                  {t.client_name.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{t.client_name}</p>
                  {t.model_bought && (
                    <p className="text-xs text-ink-muted">Comprador do {t.model_bought}</p>
                  )}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        <a
          href={getWhatsAppLink('Oi Lucas! Vi os depoimentos no site e queria saber mais.') ?? '#'}
          className="mt-8 inline-block text-sm font-semibold text-terracotta-dark underline-offset-4 hover:underline"
        >
          Ver mais avaliações no WhatsApp →
        </a>
      </div>
    </section>
  )
}
