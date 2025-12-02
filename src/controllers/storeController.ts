import type { Request, Response } from 'express'
import storeService from '@src/services/storeService'

export class StoreController {
    async getProduct(req: Request, res: Response) {
        try {
            const { id } = req.params
            const productId = parseInt(id)

            if (isNaN(productId)) {
                res.status(400).json({ error: 'Invalid product ID' })

                return
            }

            const product = await storeService.getProductById(productId)

            res.send(product)
        } catch (error) {
            console.error('Error fetching product:', error)
            res.status(500).json({ error: 'Internal server error' })
        }
    }

    async getProducts(req: Request, res: Response) {
        let ids: number[] | null = null

        if (req.query.ids) {
            // @ts-ignore
            ids = JSON.parse(req.query.ids ? req.query.ids : "[]")
        }

        try {
            const products = await storeService.getProducts(ids)

            res.send(products)
        } catch (error) {
            console.error('Error fetching products:', error)
            res.status(500).json({ error: 'Internal server error' })
        }
    }
}

export default new StoreController()
