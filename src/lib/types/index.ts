import type { Database } from '@src/lib/types/supabase'

export type TClan = Database['public']['Tables']['clans']['Update']
export type TClanInvitation = Database['public']['Tables']['clanInvitations']['Update']
export type TNotification = Database['public']['Tables']['notifications']['Update']
export type TLevel = Database['public']['Tables']['levels']['Update']
export type TPlayer = Database['public']['Tables']['players']['Update']
export type TRecord = Database['public']['Tables']['records']['Update']
