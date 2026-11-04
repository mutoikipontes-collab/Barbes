// Gerado a partir do banco Supabase (projeto barber-os). Não edite à mão:
// quando o banco mudar, os tipos são gerados de novo.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type AppointmentStatus = 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
type ShopRole = 'owner' | 'barber'
type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'suspended' | 'cancelled'

export type Database = {
  __InternalSupabase: { PostgrestVersion: '14.18' }
  public: {
    Tables: {
      appointments: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          customer_id: string
          customer_notes: string | null
          ends_at: string
          id: string
          price_cents: number
          reschedule_count: number
          service_id: string
          shop_id: string
          source: string
          staff_id: string
          staff_notes: string | null
          starts_at: string
          status: AppointmentStatus
          updated_at: string
        }
        Insert: {
          customer_id: string
          ends_at: string
          price_cents: number
          service_id: string
          shop_id: string
          staff_id: string
          starts_at: string
          customer_notes?: string | null
          staff_notes?: string | null
          source?: string
          status?: AppointmentStatus
        }
        Update: {
          staff_notes?: string | null
          status?: AppointmentStatus
          cancel_reason?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          shop_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          name: string
          phone: string
          shop_id: string
          email?: string | null
          notes?: string | null
          user_id?: string | null
        }
        Update: {
          name?: string
          phone?: string
          email?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          active: boolean
          code: string
          created_at: string
          features: Json
          id: string
          name: string
          price_cents: number
        }
        Insert: { code: string; name: string; price_cents: number; active?: boolean; features?: Json }
        Update: { name?: string; price_cents?: number; active?: boolean; features?: Json }
        Relationships: []
      }
      platform_admins: {
        Row: { created_at: string; user_id: string }
        Insert: { user_id: string }
        Update: { user_id?: string }
        Relationships: []
      }
      profiles: {
        Row: { created_at: string; full_name: string | null; id: string; phone: string | null; updated_at: string }
        Insert: { id: string; full_name?: string | null; phone?: string | null }
        Update: { full_name?: string | null; phone?: string | null }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          duration_min: number
          id: string
          name: string
          price_cents: number
          shop_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          duration_min: number
          name: string
          price_cents: number
          shop_id: string
          active?: boolean
          description?: string | null
          sort_order?: number
        }
        Update: {
          duration_min?: number
          name?: string
          price_cents?: number
          active?: boolean
          description?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      shop_hours: {
        Row: { closes_at: string; id: string; opens_at: string; shop_id: string; weekday: number }
        Insert: { closes_at: string; opens_at: string; shop_id: string; weekday: number }
        Update: { closes_at?: string; opens_at?: string; weekday?: number }
        Relationships: []
      }
      shops: {
        Row: {
          address_line: string | null
          cancel_limit_min: number
          city: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_active: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          max_advance_days: number
          min_notice_min: number
          name: string
          phone: string | null
          postal_code: string | null
          slot_step_min: number
          slug: string
          state: string | null
          timezone: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: { name: string; slug: string }
        Update: {
          address_line?: string | null
          cancel_limit_min?: number
          city?: string | null
          cover_url?: string | null
          description?: string | null
          email?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          max_advance_days?: number
          min_notice_min?: number
          name?: string
          phone?: string | null
          postal_code?: string | null
          slot_step_min?: number
          state?: string | null
          timezone?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          active: boolean
          bio: string | null
          bookable: boolean
          created_at: string
          display_name: string
          id: string
          photo_url: string | null
          role: ShopRole
          shop_id: string
          sort_order: number
          specialties: string[]
          updated_at: string
          user_id: string | null
          invite_token_hash: string | null
          invite_expires_at: string | null
          whatsapp: string | null
        }
        Insert: {
          display_name: string
          shop_id: string
          active?: boolean
          bio?: string | null
          bookable?: boolean
          photo_url?: string | null
          role?: ShopRole
          sort_order?: number
          specialties?: string[]
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          display_name?: string
          active?: boolean
          bio?: string | null
          bookable?: boolean
          photo_url?: string | null
          role?: ShopRole
          sort_order?: number
          specialties?: string[]
          whatsapp?: string | null
        }
        Relationships: []
      }
      staff_hours: {
        Row: { end_time: string; id: string; shop_id: string; staff_id: string; start_time: string; weekday: number }
        Insert: { end_time: string; shop_id: string; staff_id: string; start_time: string; weekday: number }
        Update: { end_time?: string; start_time?: string; weekday?: number }
        Relationships: []
      }
      staff_services: {
        Row: { service_id: string; shop_id: string; staff_id: string }
        Insert: { service_id: string; shop_id: string; staff_id: string }
        Update: { service_id?: string; staff_id?: string }
        Relationships: []
      }
      subscriptions: {
        Row: {
          admin_notes: string | null
          created_at: string
          current_period_end: string | null
          id: string
          plan_id: string
          provider: string | null
          provider_ref: string | null
          shop_id: string
          status: SubscriptionStatus
          updated_at: string
        }
        Insert: { plan_id: string; shop_id: string; status?: SubscriptionStatus }
        Update: { status?: SubscriptionStatus }
        Relationships: []
      }
      time_blocks: {
        Row: {
          created_at: string
          created_by: string | null
          ends_at: string
          id: string
          reason: string | null
          shop_id: string
          staff_id: string | null
          starts_at: string
        }
        Insert: {
          ends_at: string
          shop_id: string
          starts_at: string
          reason?: string | null
          staff_id?: string | null
        }
        Update: { ends_at?: string; starts_at?: string; reason?: string | null; staff_id?: string | null }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      admin_list_shops: { Args: never; Returns: Json }
      admin_platform_overview: { Args: never; Returns: Json }
      admin_update_subscription: {
        Args: { p_shop_id: string; p_status: SubscriptionStatus; p_current_period_end?: string; p_admin_notes?: string }
        Returns: Json
      }
      create_shop: { Args: { p_name: string; p_slug: string; p_timezone?: string }; Returns: Json }
      create_staff_invite: { Args: { p_staff_id: string }; Returns: string }
      get_staff_invite: { Args: { p_token: string }; Returns: Json }
      accept_staff_invite: { Args: { p_token: string }; Returns: Json }
      customer_reschedule_booking: { Args: { p_appointment_id: string; p_new_starts_at: string }; Returns: Json }
      customer_cancel_booking: { Args: { p_appointment_id: string; p_reason?: string }; Returns: Json }
      customer_create_booking: {
        Args: {
          p_shop_id: string
          p_service_id: string
          p_starts_at: string
          p_staff_id?: string
          p_phone?: string
          p_notes?: string
        }
        Returns: Json
      }
      get_available_days: {
        Args: { p_shop_id: string; p_service_id: string; p_from: string; p_to: string; p_staff_id?: string }
        Returns: { day: string; slots: number }[]
      }
      get_available_slots: {
        Args: { p_shop_id: string; p_service_id: string; p_date: string; p_staff_id?: string }
        Returns: { staff_id: string; starts_at: string; ends_at: string }[]
      }
      get_my_shops: { Args: never; Returns: Json }
      get_platform_info: { Args: never; Returns: Json }
      get_shop_billing: { Args: { p_shop_id: string }; Returns: Json }
      admin_get_settings: { Args: never; Returns: Json }
      admin_update_settings: {
        Args: { p_pix_key: string; p_pix_holder: string; p_support_whatsapp: string; p_trial_days: number; p_grace_days: number }
        Returns: Json
      }
      admin_register_payment: { Args: { p_shop_id: string; p_months?: number }; Returns: Json }
      get_public_shop: { Args: { p_slug: string }; Returns: Json }
      get_shop_subscription: { Args: { p_shop_id: string }; Returns: Json }
      is_slug_available: { Args: { p_slug: string }; Returns: boolean }
      my_appointments: { Args: never; Returns: Json }
      staff_create_booking: {
        Args: {
          p_shop_id: string
          p_staff_id: string
          p_service_id: string
          p_starts_at: string
          p_customer_name: string
          p_customer_phone: string
          p_customer_email?: string
          p_notes?: string
        }
        Returns: Json
      }
      staff_reschedule_booking: {
        Args: { p_appointment_id: string; p_new_starts_at: string; p_new_staff_id?: string }
        Returns: Json
      }
    }
    Enums: {
      appointment_status: AppointmentStatus
      shop_role: ShopRole
      subscription_status: SubscriptionStatus
    }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
