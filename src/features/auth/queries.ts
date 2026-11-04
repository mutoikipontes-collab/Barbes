import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthProvider'

export type MyShop = {
  id: string
  name: string
  slug: string
  is_active: boolean
  role: 'owner' | 'barber'
  staff_id: string
  subscription: { status: string; current_period_end: string | null; plan: string; price_cents: number }
}

// O admin só consegue ler a própria linha em platform_admins (regra RLS).
export function useIsPlatformAdmin() {
  const { session } = useAuth()
  const userId = session?.user.id
  return useQuery({
    queryKey: ['is-platform-admin', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('platform_admins').select('user_id').eq('user_id', userId!).maybeSingle()
      if (error) throw error
      return !!data
    },
  })
}

export function useMyShops() {
  const { session } = useAuth()
  return useQuery({
    queryKey: ['my-shops', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_shops')
      if (error) throw error
      return (data ?? []) as unknown as MyShop[]
    },
  })
}

export function useProfile() {
  const { session } = useAuth()
  const userId = session?.user.id
  return useQuery({
    queryKey: ['profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId!).maybeSingle()
      if (error) throw error
      return data
    },
  })
}
