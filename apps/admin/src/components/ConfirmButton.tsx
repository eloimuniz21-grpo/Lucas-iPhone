import { useState } from 'react'

/**
 * Botão de ação destrutiva com confirmação inline (dois cliques), em vez de
 * window.confirm — mais amigável no mobile e não bloqueia a UI com um
 * dialog nativo do navegador.
 */
export function ConfirmButton({
  label,
  confirmLabel = 'Confirmar?',
  onConfirm,
  className,
}: {
  label: string
  confirmLabel?: string
  onConfirm: () => void
  className?: string
}) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            setConfirming(false)
            onConfirm()
          }}
          className="rounded-md bg-danger px-2.5 py-1 text-xs font-semibold text-white"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-ink-muted hover:bg-cream-soft"
        >
          Cancelar
        </button>
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className={className ?? 'text-xs font-medium text-danger hover:underline'}
    >
      {label}
    </button>
  )
}
