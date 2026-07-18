import { useAboutContent, useStatsContent } from '../lib/hooks'

export function AboutSection() {
  const { content: about } = useAboutContent()
  const { content: stats } = useStatsContent()

  const statItems = [
    { value: stats.clients, label: 'Clientes atendidos' },
    { value: stats.years, label: 'De experiência' },
    { value: stats.sealed_pct, label: 'Aparelhos lacrados' },
    { value: stats.delivery, label: 'Entrega em SP capital' },
  ]

  return (
    <section id="sobre" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-terracotta">Sobre nós</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
            {about.title}
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-ink-muted sm:text-base">
            <p>{about.paragraph1}</p>
            <p>{about.paragraph2}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {statItems.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border bg-card p-4 sm:p-6"
            >
              <p className="text-2xl font-bold text-terracotta sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs text-ink-muted sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
