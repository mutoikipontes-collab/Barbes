import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type PlatformInfo = { support_whatsapp: string | null; trial_days: number }

/** Informações públicas da plataforma (WhatsApp de suporte, dias de teste). */
export function usePlatformInfo() {
  return useQuery({
    queryKey: ['platform-info'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_platform_info')
      if (error) throw error
      return data as unknown as PlatformInfo
    },
  })
}
