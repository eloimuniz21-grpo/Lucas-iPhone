const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined

/**
 * Monta um link wa.me. Se o número ainda não foi configurado (ver
 * .env.example), retorna undefined e os componentes devem tratar isso —
 * evita publicar um link de WhatsApp quebrado.
 */
export function getWhatsAppLink(message: string) {
  if (!WHATSAPP_NUMBER) return undefined
  const text = encodeURIComponent(message)
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`
}
