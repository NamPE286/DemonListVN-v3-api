import express from 'express'
import storeController from '@src/controllers/storeController'

const router = express.Router()

router.route('/product/:id')
    .get(storeController.getProduct.bind(storeController))

router.route('/products')
    .get(storeController.getProducts.bind(storeController))

export default router
