import { getProductByID, getProducts } from "@src/services/store.service"
import express from "express"

const router = express.Router()

router.route('/product/:id')
    /**
     * @openapi
     * "/store/product/{id}":
     *   get:
     *     tags:
     *       - Store
     *     summary: Get a product by ID
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The product ID
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     *       400:
     *         description: Invalid product ID
     *       500:
     *         description: Internal server error
     */
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
    /**
     * @openapi
     * "/store/products":
     *   get:
     *     tags:
     *       - Store
     *     summary: Get all products or products by IDs
     *     parameters:
     *       - name: ids
     *         in: query
     *         description: JSON array of product IDs to filter by
     *         required: false
     *         schema:
     *           type: string
     *           example: "[1,2,3]"
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     *       500:
     *         description: Internal server error
     */
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