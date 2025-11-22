import type { Request, Response, NextFunction } from 'express'
import { getInventoryItem } from '@src/lib/client/inventory'

export default async function (req: Request, res: Response, next: NextFunction) {
    const { user } = res.locals
    const { id } = req.params

    try {
        const item = await getInventoryItem(Number(id))

        if (!item || item.userID != user.uid) {
            return res.status(403).send({ error: 'User not owning this item' })
        }

        res.locals.item = item
        next()
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
}
