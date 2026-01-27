import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'

export type Product = Database['public']['Tables']['products']['Row']

export const getProducts = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const getProduct = async (id: string) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export const getProductsByCategory = async (category: string) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
