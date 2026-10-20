import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase env vars manquantes — copie .env.example vers .env.development et renseigne VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. En attendant, un client factice est utilisé (l’auth ne fonctionnera pas).'
  )
}

// URL de repli valide pour que createClient ne plante pas tant que le vrai projet Supabase n'existe pas.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
