import type { Request, Response } from 'express'
import inventoryService from '@src/services/inventoryService'

export class InventoryController {
    async getInventoryItems(req: Request, res: Response) {
        const { user } = res.locals

        try {
            const items = await inventoryService.getInventoryItems(user)

            res.send(items)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async getInventoryItem(req: Request, res: Response) {
        try {
            res.send(res.locals.item)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async consumeItem(req: Request, res: Response) {
        const { item, user } = res.locals

        if (!item) {
            res.status(404).send()

            return
        }

        try {
            const result = await inventoryService.consumeItem(user, item)

            if (result) {
                res.send(result)
            } else {
                res.status(200).send()
            }
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }
}

export default new InventoryController()
