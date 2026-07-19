import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <Logo />
          <p className="text-xs text-ink-muted">
            © {new Date().getFullYear()} Vero — iPhones verdadeiros, atendimento pessoal com o Lucas.
          </p>
        </div>
      </div>
    </footer>
  )
}
