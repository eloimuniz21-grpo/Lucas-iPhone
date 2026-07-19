import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import type { AboutContent, AvailableDevice, HeroContent, SiteModel, StatsContent, Testimonial } from './types'
import { trackEvent, type SiteEventType } from './analytics'

/**
 * Busca uma seção de public.site_content pela chave e já aplica um valor
 * padrão enquanto carrega (ou se a linha ainda não existir, ou se a busca
 * falhar por qualquer motivo de rede) — assim a página nunca aparece vazia
 * ou trava num estado de carregamento infinito para o visitante.
 */
function useSiteContentSection<T>(sectionKey: string, fallback: T) {
  const [content, setContent] = useState<T>(fallback)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const { data, error } = await supabase
          .from('site_content')
          .select('content')
          .eq('section_key', sectionKey)
          .maybeSingle()

        if (!active) return
        if (!error && data?.content) {
          setContent({ ...fallback, ...(data.content as object) } as T)
        }
      } catch (err) {
        console.error(`Falha ao buscar site_content.${sectionKey}, usando conteúdo padrão:`, err)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKey])

  return { content, loading }
}

const heroFallback: HeroContent = {
  badge: 'Atendimento personalizado',
  title: 'Seu próximo iPhone com a confiança de quem entende.',
  subtitle:
    'Sou o Lucas, e transformo a compra do seu iPhone em uma experiência. Sem processo engessado, uma consultoria completa. Apenas aparelhos originais e suporte direto via WhatsApp.',
  clients_badge: '+200 clientes',
}

const statsFallback: StatsContent = {
  clients: '500+',
  years: '7 anos',
  sealed_pct: '100%',
  delivery: '1 dia',
}

const aboutFallback: AboutContent = {
  title: 'Não somos uma loja. Somos consultores que entendemos o nosso produto.',
  paragraph1:
    'Comecei em 2019 vendendo para amigos que queriam fugir dos preços absurdos dos shoppings. Hoje já atendi mais de 200 clientes, sempre com aparelhos originais.',
  paragraph2:
    'Meu diferencial é simples: eu atendo você direto no WhatsApp, tiro suas dúvidas sobre modelos, câmeras, armazenamento, e só fecho quando faz sentido pra você.',
}

export const useHeroContent = () => useSiteContentSection<HeroContent>('hero', heroFallback)
export const useStatsContent = () => useSiteContentSection<StatsContent>('stats', statsFallback)
export const useAboutContent = () => useSiteContentSection<AboutContent>('about', aboutFallback)

export function useSiteModels() {
  const [models, setModels] = useState<SiteModel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const { data, error } = await supabase
          .from('site_models')
          .select('*')
          .eq('visible', true)
          .order('display_order', { ascending: true })

        if (!active) return
        if (!error && data) setModels(data as SiteModel[])
      } catch (err) {
        console.error('Falha ao buscar site_models:', err)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  return { models, loading }
}

export function useTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('published', true)
          .order('display_order', { ascending: true })

        if (!active) return
        if (!error && data) setTestimonials(data as Testimonial[])
      } catch (err) {
        console.error('Falha ao buscar testimonials:', err)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  return { testimonials, loading }
}

/** Estoque real (public.available_devices) — modelos efetivamente
 * disponíveis agora, sem preço nem custo, diferente da vitrine de
 * marketing (site_models). */
export function useAvailableDevices() {
  const [devices, setDevices] = useState<AvailableDevice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const { data, error } = await supabase
          .from('available_devices')
          .select('*')
          .order('created_at', { ascending: false })

        if (!active) return
        if (!error && data) setDevices(data as AvailableDevice[])
      } catch (err) {
        console.error('Falha ao buscar available_devices:', err)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  return { devices, loading }
}

/** Dispara um evento de analytics uma única vez, quando o elemento
 * referenciado entra na viewport (ex: "chegou a ver a seção de estoque"). */
export function useTrackOnceVisible<T extends HTMLElement>(eventType: SiteEventType, metadata?: Record<string, unknown>) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    let fired = false
    const observer = new IntersectionObserver(
      (entries) => {
        if (fired) return
        for (const entry of entries) {
          if (entry.isIntersecting) {
            fired = true
            trackEvent(eventType, metadata)
            observer.disconnect()
            break
          }
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType])

  return ref
}
