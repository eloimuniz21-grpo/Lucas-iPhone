import { useEffect, useState } from 'react'
import { Logo } from './Logo'

const LINKS = [
  { href: '#modelos', label: 'Modelos' },
  { href: '#estoque', label: 'Estoque' },
  { href: '#sobre', label: 'Sobre' },
  { href: '#depoimentos', label: 'Depoimentos' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  // Trava o scroll do body quando o menu mobile está aberto.
  useEffect(() => {
    document.body.classList.toggle('menu-open', open)
    return () => document.body.classList.remove('menu-open')
  }, [open])

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-cream/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#" aria-label="Vero — início">
          <Logo />
        </a>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-muted transition-colors hover:text-terracotta"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Botão hamburguer — só mobile/tablet */}
        <button
          type="button"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-md text-ink md:hidden"
        >
          <span className="sr-only">Menu</span>
          <div className="relative h-4 w-5">
            <span
              className={`absolute left-0 top-0 h-0.5 w-5 bg-current transition-transform ${open ? 'translate-y-[7px] rotate-45' : ''}`}
            />
            <span
              className={`absolute left-0 top-[7px] h-0.5 w-5 bg-current transition-opacity ${open ? 'opacity-0' : 'opacity-100'}`}
            />
            <span
              className={`absolute left-0 top-[14px] h-0.5 w-5 bg-current transition-transform ${open ? '-translate-y-[7px] -rotate-45' : ''}`}
            />
          </div>
        </button>
      </div>

      {/* Menu mobile em tela cheia */}
      {open && (
        <nav className="flex flex-col gap-1 border-t border-border bg-cream px-4 pb-6 pt-2 md:hidden">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-3 text-base font-medium text-ink active:bg-cream-soft"
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}
