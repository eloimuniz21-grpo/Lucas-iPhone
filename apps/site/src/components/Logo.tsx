/** Marca "Vero" — quadrado arredondado terracota com um V, remete a
 * "verdadeiro/autêntico" (a maior objeção de quem compra usado é
 * "será que é original?"). Substitui o raio roxo herdado do template. */
export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 84 84" fill="none" className={className} aria-hidden>
      <rect x="14" y="14" width="56" height="56" rx="18" fill="var(--color-terracotta)" />
      <path
        d="M30 28 L42 56 L54 28"
        stroke="white"
        strokeWidth={6.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <LogoMark />
      <span className="text-lg font-semibold tracking-tight text-ink">Vero</span>
    </span>
  )
}
