import type { Request, Response } from 'express'
import itemService from '@src/services/itemService'

export class ItemController {
    async getItem(req: Request, res: Response) {
        try {
            const { id } = req.params
            const item = await itemService.getItemById(Number(id))

            res.send(item)
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    }
}

export default new ItemController()
