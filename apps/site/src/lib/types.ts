export interface HeroFeature {
  icon: string
  label: string
}

export interface HeroContent {
  badge: string
  title: string
  subtitle: string
  clients_badge: string
  photo_url?: string | null
  features?: HeroFeature[]
}

export interface StatsContent {
  clients: string
  years: string
  sealed_pct: string
  delivery: string
}

export interface AboutContent {
  title: string
  paragraph1: string
  paragraph2: string
}

export interface SiteModel {
  id: string
  label: string
  tag: string | null
  photo_url: string | null
  display_order: number
  visible: boolean
}

export interface Testimonial {
  id: string
  client_name: string
  quote: string
  model_bought: string | null
  display_order: number
}
