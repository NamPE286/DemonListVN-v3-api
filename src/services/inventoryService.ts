import { consumeCase } from '@src/lib/client/inventory'
import supabase from '@src/database/supabase'
import type Player from '@lib/classes/Player'

export class InventoryService {
    async getInventoryItems(user: Player) {
        return await user.getInventoryItems()
    }

    async consumeItem(user: Player, item: any) {
        if (item.type == 'case') {
            return await consumeCase(user, item.inventoryId, item.itemId)
        } else {
            const { error } = await supabase
                .from('inventory')
                .update({ consumed: true })
                .eq('id', item.inventoryId)

            if (error) {
                throw error
            }

            return null
        }
    }
}

export default new InventoryService()
