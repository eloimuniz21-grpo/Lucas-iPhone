import { useAuth } from '../lib/auth'
import { LogoMark } from '../components/Logo'

export function Login() {
  const { status, deniedEmail, signInWithGoogle, retryCheck } = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-soft px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <LogoMark className="mx-auto h-12 w-12" />
        <p className="mt-3 text-lg font-semibold text-ink">Vero</p>
        <p className="mt-1 text-sm text-ink-muted">Painel de gestão</p>

        {deniedEmail && (
          <div className="mt-6 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            O e-mail <span className="font-semibold">{deniedEmail}</span> não tem acesso a
            este painel. Fale com quem administra o projeto se isso for um engano.
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 rounded-lg border border-terracotta/30 bg-terracotta-light p-3 text-sm text-terracotta-dark">
            Não consegui confirmar seu acesso agora (parece um problema passageiro de conexão, não
            de permissão). Sua sessão continua ativa — tenta de novo.
            <button
              type="button"
              onClick={retryCheck}
              className="mt-2 block w-full rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-white"
            >
              Tentar de novo
            </button>
          </div>
        )}

        {status !== 'error' && (
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={status === 'checking-admin'}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-ink shadow-sm transition-colors hover:border-ink/20 disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path
                fill="#4285F4"
                d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.87c2.27-2.09 3.58-5.17 3.58-8.81Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.1C3.24 21.3 7.28 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28v-3.1H1.27A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.27 5.38l4-3.1Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.28 0 3.24 2.7 1.27 6.62l4 3.1C6.22 6.88 8.87 4.77 12 4.77Z"
              />
            </svg>
            {status === 'checking-admin' ? 'Verificando acesso…' : 'Entrar com Google'}
          </button>
        )}

        <p className="mt-6 text-xs text-ink-muted">
          Acesso restrito. Só e-mails autorizados conseguem entrar aqui.
        </p>
      </div>
    </div>
  )
}
