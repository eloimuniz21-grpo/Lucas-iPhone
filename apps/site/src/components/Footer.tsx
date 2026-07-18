export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm font-semibold text-ink">Lucas.iphones</p>
          <p className="text-xs text-ink-muted">
            © {new Date().getFullYear()} Lucas.iphones — Atendimento pessoal, aparelhos originais.
          </p>
        </div>
      </div>
    </footer>
  )
}
