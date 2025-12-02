import { getProductByID, getProducts } from "@src/lib/client/store"
import express from "express"

const router = express.Router()

router.route('/product/:id')
    .get(async (req, res) => {
        try {
            const { id } = req.params
            const productId = parseInt(id)

            if (isNaN(productId)) {
                return res.status(400).json({ error: 'Invalid product ID' })
            }

            const product = await getProductByID(productId)

            res.send(product)
        } catch (error) {
            console.error('Error fetching product:', error)
            res.status(500).json({ error: 'Internal server error' })
        }
    })

router.route('/products')
    .get(async (req, res) => {
        let ids: number[] | null = null

        if (req.query.ids) {
            // @ts-ignore
            ids = JSON.parse(req.query.ids ? req.query.ids : "[]")
        }

        try {
            const products = await getProducts(ids)

            res.send(products)
        } catch (error) {
            console.error('Error fetching products:', error)
            res.status(500).json({ error: 'Internal server error' })
        }
    })

export default router