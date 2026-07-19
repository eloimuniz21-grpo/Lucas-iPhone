import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Variáveis VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não configuradas. ' +
      'Copie .env.example para .env.local e preencha os valores.',
  )
}

// Mesmo aqui no admin, usamos só a chave anon/publishable. O acesso real
// é controlado por RLS + a tabela public.admins, nunca por uma chave
// "secreta" escondida no frontend (isso não existiria de verdade).
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
