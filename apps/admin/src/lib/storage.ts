import { supabase } from './supabase'

/**
 * Sobe uma imagem pro bucket público site-images e devolve a URL pública.
 * O bucket só aceita escrita de quem está na tabela admins (ver política
 * de storage na migration) — a chave anon sozinha não basta.
 */
export async function uploadSiteImage(file: File, folder: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${folder}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from('site-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw error

  const { data } = supabase.storage.from('site-images').getPublicUrl(path)
  return data.publicUrl
}
