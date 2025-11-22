import type { Request, Response, NextFunction } from 'express'
import { getInventoryItem } from '@src/lib/client/inventory'
import type { TInventoryItem } from '@src/lib/types'

export default async function (req: Request, res: Response, next: NextFunction) {
    const { user } = res.locals
    const { id } = req.params

    try {
        const item = await getInventoryItem(Number(id))

        if (!item || item.userID != user.uid) {
            return res.status(403).send({ error: 'User not owning this item' })
        }

        const mapped: TInventoryItem = {
            userID: item.userID,
            itemId: item.itemId,
            content: item.content,
            created_at: item.created_at,
            inventoryId: item.id,
            name: item.items ? item.items.name : '',
            type: item.items ? item.items.type : '',
            redirect: item.items ? item.items.redirect : null,
            productId: item.items ? item.items.productId : null,
            description: item.items ? item.items.description : null,
            rarity: item.items?.rarity!,
            quantity: item.items?.quantity!,
            expireAt: item.expireAt,
            useRedirect: item.redirectTo
        }

        res.locals.item = mapped
        next()
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
}
