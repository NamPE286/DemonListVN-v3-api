import express from 'express'
import itemController from '@src/controllers/itemController'

const router = express.Router()

router.route('/:id')
    .get((req, res) => itemController.getItem(req, res))

export default router
