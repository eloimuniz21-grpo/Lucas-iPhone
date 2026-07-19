import { supabase } from './supabase'

const SESSION_KEY = 'vero_session_id'

export type SiteEventType = 'session_start' | 'whatsapp_click' | 'review_submit'

/** Um id anônimo por aba/sessão de navegação — não é PII, só agrupa eventos
 * da mesma visita. Guardado em sessionStorage (não localStorage) então some
 * quando a aba fecha, o que já é suficiente pra medir entrada de leads. */
function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    // sessionStorage indisponível (aba anônima restrita etc) — usa um id
    // efêmero só pra essa chamada, não quebra o rastreio nem a navegação.
    return `ephemeral-${Math.random().toString(36).slice(2)}`
  }
}

/** Fire-and-forget: nunca deve atrapalhar a navegação do visitante. Falha
 * de rede/RLS só vai pro console, sem lançar erro pra quem chamou. */
export function trackEvent(eventType: SiteEventType, metadata: Record<string, unknown> = {}) {
  const sessionId = getSessionId()
  supabase
    .from('site_events')
    .insert({ session_id: sessionId, event_type: eventType, metadata })
    .then(({ error }) => {
      if (error) console.error('Falha ao registrar evento de analytics:', error)
    })
}

let sessionStartFired = false

/** Chamar uma vez, no mount do App — protegido contra o double-invoke do
 * StrictMode em dev (senão contaria 2 sessions por carregamento). */
export function trackSessionStart() {
  if (sessionStartFired) return
  sessionStartFired = true
  trackEvent('session_start', { path: window.location.pathname, referrer: document.referrer || null })
}
