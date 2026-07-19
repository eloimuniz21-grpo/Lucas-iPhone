import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { trackEvent } from '../lib/analytics'

type Status = 'idle' | 'sending' | 'sent' | 'error'

/** Formulário público de avaliação. Todo envio entra sempre como rascunho
 * (a RLS de public.testimonials força published=false pra visitantes
 * anônimos — ver migração 0006) e só aparece no site depois que o Lucas
 * aprova pela aba Depoimentos no painel. */
export function ReviewForm() {
  const [clientName, setClientName] = useState('')
  const [quote, setQuote] = useState('')
  const [modelBought, setModelBought] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  const nameValid = clientName.trim().length >= 2
  const quoteValid = quote.trim().length >= 10

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (honeypot) {
      // Provavelmente um bot (só formulários automatizados preenchem um
      // campo escondido) — finge sucesso pra não dar dica de como driblar.
      setStatus('sent')
      return
    }
    if (!nameValid || !quoteValid) return

    setStatus('sending')
    const { error } = await supabase.from('testimonials').insert({
      client_name: clientName.trim(),
      quote: quote.trim(),
      model_bought: modelBought.trim() || null,
      published: false,
    })

    if (error) {
      console.error('Falha ao enviar avaliação:', error)
      setStatus('error')
      return
    }

    trackEvent('review_submit', { model: modelBought.trim() || null })
    setStatus('sent')
    setClientName('')
    setQuote('')
    setModelBought('')
  }

  if (status === 'sent') {
    return (
      <div className="mt-8 max-w-xl rounded-2xl border border-terracotta/20 bg-terracotta-light/40 p-5 text-sm text-terracotta-dark">
        Obrigado! 🙏 Sua avaliação foi enviada e vai aparecer no site assim que o Lucas confirmar.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-xl rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h3 className="text-sm font-semibold text-ink">Comprou com a gente? Deixe sua avaliação ✍️</h3>

      <div className="mt-4 space-y-3">
        {/* honeypot anti-spam — invisível e inalcançável por teclado pra
         * humanos; bots que preenchem todo campo do form caem aqui. */}
        <input
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute h-0 w-0 opacity-0"
          style={{ left: '-9999px' }}
        />

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink">Seu nome</span>
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            maxLength={80}
            required
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink">Sua avaliação</span>
          <textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            rows={3}
            maxLength={600}
            required
            placeholder="Conta como foi a experiência de comprar com o Lucas…"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink">Modelo que comprou (opcional)</span>
          <input
            value={modelBought}
            onChange={(e) => setModelBought(e.target.value)}
            maxLength={60}
            placeholder="ex: iPhone 14 Pro"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
          />
        </label>
      </div>

      {status === 'error' && (
        <p className="mt-3 text-xs text-red-600">Não consegui enviar agora. Tenta de novo em instantes?</p>
      )}

      <button
        type="submit"
        disabled={status === 'sending' || !nameValid || !quoteValid}
        className="mt-4 rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {status === 'sending' ? 'Enviando…' : 'Enviar avaliação'}
      </button>
    </form>
  )
}
