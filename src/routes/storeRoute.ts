import express from 'express'
import storeController from '@src/controllers/storeController'

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
     *         description: The ID of the product
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Success
     */
    .get((req, res) => storeController.getProduct(req, res))

router.route('/products')
    /**
     * @openapi
     * "/store/products":
     *   get:
     *     tags:
     *       - Store
     *     summary: Get all products
     *     responses:
     *       200:
     *         description: Success
     */
    .get((req, res) => storeController.getProducts(req, res))

export default router
