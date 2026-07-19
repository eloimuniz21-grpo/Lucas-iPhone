export type DeviceCondition = 'lacrado' | 'seminovo'
export type DeviceStatus = 'em_estoque' | 'reservado' | 'vendido'

export interface Device {
  id: string
  model: string
  storage_gb: number | null
  color: string | null
  condition: DeviceCondition | null
  cost_price: number
  imei: string | null
  status: DeviceStatus
  photo_url: string | null
  created_at: string
  sold_at: string | null
}

export type ClientGender = 'feminino' | 'masculino' | 'nao_informado'

export interface Sale {
  id: string
  device_id: string
  sale_price: number
  client_name: string | null
  client_phone: string | null
  client_gender: ClientGender | null
  client_age: number | null
  client_city: string | null
  payment_method: string | null
  sale_date: string
  notes: string | null
  created_at: string
  // Preenchido via join na consulta, não existe de fato na tabela sales.
  device?: Pick<Device, 'id' | 'model' | 'cost_price'>
}

export interface Testimonial {
  id: string
  client_name: string
  quote: string
  model_bought: string | null
  published: boolean
  display_order: number
  created_at: string
}

export interface SiteModel {
  id: string
  label: string
  tag: string | null
  photo_url: string | null
  display_order: number
  visible: boolean
  created_at: string
}

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
