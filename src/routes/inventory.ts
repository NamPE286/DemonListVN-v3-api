import userAuth from '@src/middleware/userAuth'
import itemOwnerCheck from '@src/middleware/itemOwnerCheck'
import express from 'express'
import inventoryController from '@src/controllers/inventoryController'

const router = express.Router()

router.route('/')
    .get(userAuth, inventoryController.getInventoryItems.bind(inventoryController))

router.route('/:id')
    .get(userAuth, itemOwnerCheck, inventoryController.getInventoryItem.bind(inventoryController))

router.route('/:id/consume')
    .delete(userAuth, itemOwnerCheck, inventoryController.consumeItem.bind(inventoryController))

export default router
