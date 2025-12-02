import userAuth from '@src/middleware/userAuth'
import itemOwnerCheck from '@src/middleware/itemOwnerCheck'
import express from 'express'
import inventoryController from '@src/controllers/inventoryController'

const router = express.Router()

router.route('/')
    .get(userAuth, (req, res) => inventoryController.getInventoryItems(req, res))

router.route('/:id')
    .get(userAuth, itemOwnerCheck, (req, res) => inventoryController.getInventoryItem(req, res))

router.route('/:id/consume')
    .delete(userAuth, itemOwnerCheck, (req, res) => inventoryController.consumeItem(req, res))

export default router
