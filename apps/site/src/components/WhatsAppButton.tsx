import { getWhatsAppLink } from '../lib/whatsapp'
import { trackEvent } from '../lib/analytics'

export function WhatsAppButton() {
  const link = getWhatsAppLink('Oi Lucas! Vim pelo site e queria falar com você. 😊')
  if (!link) return null

  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      onClick={() => trackEvent('whatsapp_click', { model: null, source: 'botao_flutuante' })}
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform active:scale-95 sm:bottom-6 sm:right-6"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <svg viewBox="0 0 32 32" fill="currentColor" className="h-7 w-7" aria-hidden>
        <path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.386.7 4.61 1.91 6.48L4 29l7.72-1.87A11.94 11.94 0 0 0 16 27c6.627 0 12-5.373 12-12S22.628 3 16.001 3Zm0 21.8c-2.02 0-3.9-.59-5.48-1.6l-.39-.24-4.58 1.11 1.13-4.46-.26-.41A9.77 9.77 0 0 1 5.2 15c0-5.96 4.84-10.8 10.8-10.8S26.8 9.04 26.8 15 21.96 24.8 16 24.8Zm5.9-8.13c-.32-.16-1.9-.94-2.2-1.05-.3-.11-.51-.16-.73.16-.21.32-.84 1.05-1.03 1.26-.19.21-.38.24-.7.08-.32-.16-1.36-.5-2.6-1.6-.96-.86-1.61-1.92-1.8-2.24-.19-.32-.02-.5.14-.66.14-.14.32-.38.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.73-1.76-1-2.41-.26-.63-.53-.55-.73-.56h-.62c-.21 0-.56.08-.85.4-.29.32-1.12 1.1-1.12 2.68 0 1.58 1.15 3.1 1.31 3.32.16.21 2.26 3.45 5.47 4.84.76.33 1.36.53 1.82.67.77.24 1.46.21 2.02.13.62-.09 1.9-.78 2.17-1.53.27-.75.27-1.4.19-1.53-.08-.13-.29-.21-.61-.37Z" />
      </svg>
    </a>
  )
}
