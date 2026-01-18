import type { Database } from '@src/types/supabase'

export type TClan = Database['public']['Tables']['clans']['Update']
export type TClanInvitation = Database['public']['Tables']['clanInvitations']['Update']
export type TNotification = Database['public']['Tables']['notifications']['Update']
export type TLevel = Database['public']['Tables']['levels']['Update']
export type TPlayer = Database['public']['Tables']['players']['Update']
export type TRecord = Database['public']['Tables']['records']['Update']
export type TInventoryRow = Database['public']['Tables']['inventory']['Row']
export type TItemRow = Database['public']['Tables']['items']['Row']
export type TInventoryWithItem = TInventoryRow & { items?: TItemRow | null }
export type TInventoryItem = {
	userID: TInventoryRow['userID']
	itemId: TInventoryRow['itemId']
	content: TInventoryRow['content']
	created_at: TInventoryRow['created_at']
	inventoryId: TInventoryRow['id'],
	useRedirect: TInventoryRow['redirectTo'],
	expireAt: TInventoryRow['expireAt'],
	inventoryQuantity: number
} & Omit<TItemRow, 'id'>
