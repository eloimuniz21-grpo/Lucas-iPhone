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

export type DeviceCondition = 'lacrado' | 'seminovo'

/** Espelha public.available_devices — uma view que expõe só as colunas
 * seguras do estoque real (nunca cost_price/imei). Ver migração 0006. */
export interface AvailableDevice {
  id: string
  model: string
  storage_gb: number | null
  color: string | null
  condition: DeviceCondition | null
  photo_url: string | null
  created_at: string
}
