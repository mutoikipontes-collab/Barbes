import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { usePanel } from './context'

// Todas as consultas filtram por barbearia, e o banco (RLS) só devolve o que este usuário pode ver.

export function useServices() {
  const { shop } = usePanel()
  return useQuery({
    queryKey: ['panel', shop.id, 'services'],
    queryFn: async () => {
      const { data, error } = await supabase.from('services').select('*').eq('shop_id', shop.id).order('sort_order').order('name')
      if (error) throw error
      return data
    },
  })
}

export function useStaff() {
  const { shop } = usePanel()
  return useQuery({
    queryKey: ['panel', shop.id, 'staff'],
    queryFn: async () => {
      const { data, error } = await supabase.from('staff').select('*').eq('shop_id', shop.id).order('sort_order').order('display_name')
      if (error) throw error
      return data
    },
  })
}

export function useStaffServices() {
  const { shop } = usePanel()
  return useQuery({
    queryKey: ['panel', shop.id, 'staff_services'],
    queryFn: async () => {
      const { data, error } = await supabase.from('staff_services').select('*').eq('shop_id', shop.id)
      if (error) throw error
      return data
    },
  })
}

export function useStaffHours() {
  const { shop } = usePanel()
  return useQuery({
    queryKey: ['panel', shop.id, 'staff_hours'],
    queryFn: async () => {
      const { data, error } = await supabase.from('staff_hours').select('*').eq('shop_id', shop.id).order('weekday').order('start_time')
      if (error) throw error
      return data
    },
  })
}

export function useShopHours() {
  const { shop } = usePanel()
  return useQuery({
    queryKey: ['panel', shop.id, 'shop_hours'],
    queryFn: async () => {
      const { data, error } = await supabase.from('shop_hours').select('*').eq('shop_id', shop.id).order('weekday').order('opens_at')
      if (error) throw error
      return data
    },
  })
}
