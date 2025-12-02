import userAuth from '@src/middleware/userAuth'
import itemOwnerCheck from '@src/middleware/itemOwnerCheck'
import express from 'express'
import inventoryController from '@src/controllers/inventoryController'

const router = express.Router()

router.route('/')
    /**
     * @openapi
     * "/inventory":
     *   get:
     *     tags:
     *       - Inventory
     *     summary: Get all inventory items for the authenticated user
     *     responses:
     *       200:
     *         description: Success
     */
    .get(userAuth, (req, res) => inventoryController.getInventoryItems(req, res))

router.route('/:id')
    /**
     * @openapi
     * "/inventory/{id}":
     *   get:
     *     tags:
     *       - Inventory
     *     summary: Get a specific inventory item
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The ID of the inventory item
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Success
     */
    .get(userAuth, itemOwnerCheck, (req, res) => inventoryController.getInventoryItem(req, res))

router.route('/:id/consume')
    /**
     * @openapi
     * "/inventory/{id}/consume":
     *   delete:
     *     tags:
     *       - Inventory
     *     summary: Consume/use an inventory item
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The ID of the inventory item
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Success
     */
    .delete(userAuth, itemOwnerCheck, (req, res) => inventoryController.consumeItem(req, res))

export default router
