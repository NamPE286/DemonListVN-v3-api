import supabase from '@src/database/supabase'
import type Player from '@lib/classes/Player'
import { getCase as getCaseItems } from '@src/lib/client/item'

type CaseItem = Awaited<ReturnType<typeof getCaseItems>> extends Array<infer T> ? T : never

type Reward = {
    expireAfter: number | null
    description?: string | null
    id?: number
    name?: string
    productId?: number | null
    quantity?: number
    rarity?: number
    redirect?: string | null
    type?: string
}

export class InventoryService {
    async getInventoryItems(user: Player) {
        return await user.getInventoryItems()
    }

    async getInventoryItem(inventoryItemId: number) {
        const { data, error } = await supabase
            .from('inventory')
            .select('*, items(*)')
            .eq('id', inventoryItemId)
            .eq('consumed', false)
            .or(`expireAt.is.null,expireAt.gt.${new Date().toISOString()}`)
            .single()

        if (error) {
            throw error
        }

        return data
    }

    async consumeCase(player: Player, inventoryItemId: number, itemId: number) {
        const caseItems = await getCaseItems(itemId)
        const roll = Math.random()

        let x = 0

        for (const i of caseItems) {
            x += i.rate!

            if (x >= roll) {
                await this.addInventoryItem(player, i)
                await this.addCaseResult(player, inventoryItemId, i)

                return i
            }
        }

        await this.addCaseResult(player, inventoryItemId, null)

        return {}
    }

    private async addCaseResult(player: Player, inventoryItemId: number, caseItem: CaseItem | null) {
        var { error } = await supabase
            .from('inventory')
            .update({ consumed: true })
            .eq('id', inventoryItemId)

        if (error) {
            throw error
        }

        var { error: error2 } = await supabase
            .from('caseResult')
            .insert({
                openerId: player.uid!,
                resultId: caseItem ? caseItem.id : null,
                caseId: caseItem?.caseId!
            })

        if (error2) {
            throw error2
        }
    }

    private async addInventoryItem(player: Player, caseItem: CaseItem) {
        if (!player.uid) {
            throw new Error('player.uid is undefined')
        }

        if (caseItem.items?.productId) {
            if (!caseItem.expireAfter) {
                throw new Error("expireAfter is null")
            }

            var { data, error } = await supabase
                .from('coupons')
                .insert({
                    percent: 1,
                    validUntil: new Date(new Date().getTime() + caseItem.expireAfter).toISOString(),
                    productID: caseItem.items?.productId,
                    owner: player.uid
                })
                .select()
                .single()

            if (!data || error) {
                throw error
            }

            var { error: error2 } = await supabase
                .from('inventory')
                .insert({
                    userID: player.uid,
                    itemId: caseItem.itemId,
                    consumed: false,
                    redirectTo: '/redeem/' + data?.code,
                    expireAt: new Date(new Date().getTime() + caseItem.expireAfter).toISOString()
                })

            if (error2) {
                throw error2
            }
        } else {
            var { error } = await supabase
                .from('inventory')
                .insert({
                    userID: player.uid,
                    itemId: caseItem.id,
                    consumed: false
                })

            if (error) {
                throw error
            }
        }
    }

    async receiveReward(player: Player, reward: Reward) {
        if (!player.uid) {
            throw new Error('player.uid is undefined')
        }

        if (reward.productId) {
            if (!reward.expireAfter) {
                throw new Error("expireAfter is null")
            }

            var { data, error } = await supabase
                .from('coupons')
                .insert({
                    percent: 1,
                    validUntil: new Date(new Date().getTime() + reward.expireAfter).toISOString(),
                    productID: reward.productId,
                    owner: player.uid
                })
                .select()
                .single()

            if (!data || error) {
                throw error
            }

            var { error: error2 } = await supabase
                .from('inventory')
                .insert({
                    userID: player.uid,
                    itemId: reward.id!,
                    consumed: false,
                    redirectTo: '/redeem/' + data?.code,
                    expireAt: new Date(new Date().getTime() + reward.expireAfter).toISOString()
                })

            if (error2) {
                throw error2
            }
        } else {
            var { error } = await supabase
                .from('inventory')
                .insert({
                    userID: player.uid,
                    itemId: reward.id!,
                    consumed: false
                })

            if (error) {
                throw error
            }
        }
    }

    async consumeItem(user: Player, item: any) {
        if (item.type === 'case') {
            return await this.consumeCase(user, item.inventoryId, item.itemId)
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
