import express from 'express'
import itemController from '@src/controllers/itemController'

const router = express.Router()

router.route('/:id')
    .get(itemController.getItem.bind(itemController))

export default router
