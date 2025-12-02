import express from 'express'
import storeController from '@src/controllers/storeController'

const router = express.Router()

router.route('/product/:id')
    .get((req, res) => storeController.getProduct(req, res))

router.route('/products')
    .get((req, res) => storeController.getProducts(req, res))

export default router
