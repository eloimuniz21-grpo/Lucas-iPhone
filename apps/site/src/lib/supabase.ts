import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  // Falha alto e cedo em dev: mais fácil de diagnosticar do que uma tela
  // em branco silenciosa por falta de variável de ambiente.
  console.error(
    'Variáveis VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não configuradas. ' +
      'Copie .env.example para .env.local e preencha os valores.',
  )
}

// Este client usa só a chave anon/publishable — segura para o navegador.
// Nunca importe a service_role key neste app público.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
