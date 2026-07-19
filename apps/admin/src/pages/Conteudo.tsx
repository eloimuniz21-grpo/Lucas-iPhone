import { useState } from 'react'
import { TextosTab } from '../components/conteudo/TextosTab'
import { ModelosTab } from '../components/conteudo/ModelosTab'
import { DepoimentosTab } from '../components/conteudo/DepoimentosTab'

const TABS = [
  { key: 'textos', label: 'Textos' },
  { key: 'modelos', label: 'Modelos em destaque' },
  { key: 'depoimentos', label: 'Depoimentos' },
] as const

type TabKey = (typeof TABS)[number]['key']

export function Conteudo() {
  const [tab, setTab] = useState<TabKey>('textos')

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink sm:text-2xl">Conteúdo do site</h1>
      <p className="mt-1 text-sm text-ink-muted">
        O que você mudar aqui aparece na landing page pública na próxima vez que alguém carregar a
        página.
      </p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium ${
              tab === t.key
                ? 'border-terracotta bg-terracotta-light text-terracotta-dark'
                : 'border-border bg-card text-ink-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'textos' && <TextosTab />}
        {tab === 'modelos' && <ModelosTab />}
        {tab === 'depoimentos' && <DepoimentosTab />}
      </div>
    </div>
  )
}
