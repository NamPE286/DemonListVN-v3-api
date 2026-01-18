import userAuth from '@src/middleware/user-auth.middleware'
import itemOwnerCheck from '@src/middleware/item-owner-check.middleware'
import express from 'express'
import { consumeCase, consumeItem } from '@src/services/inventory.service'
import supabase from '@src/client/supabase'
import { getPlayerInventoryItems } from '@src/services/player.service'

const router = express.Router()

router.route('/')
    /**
     * @openapi
     * "/inventory":
     *   get:
     *     tags:
     *       - Inventory
     *     summary: Get user's inventory items
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     *       500:
     *         description: Internal server error
     */
    .get(userAuth, async (req, res) => {
        const { user } = res.locals

        try {
            res.send(await getPlayerInventoryItems(user.uid));
        } catch (err) {
            console.error(err);
            res.status(500).send()
        }
    })

router.route('/:id')
    /**
     * @openapi
     * "/inventory/{id}":
     *   get:
     *     tags:
     *       - Inventory
     *     summary: Get a specific inventory item by ID
     *     security:
     *       - bearerAuth: []
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
     *         content:
     *           application/json:
     *             schema:
     *       500:
     *         description: Internal server error
     */
    .get(userAuth, itemOwnerCheck, async (req, res) => {
        try {
            res.send(res.locals.item);
        } catch (err) {
            console.error(err);
            res.status(500).send()
        }
    })

router.route('/:id/consume')
    /**
     * @openapi
     * "/inventory/{id}/consume":
     *   delete:
     *     tags:
     *       - Inventory
     *     summary: Consume/use an inventory item
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The ID of the inventory item to consume
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Item consumed successfully
     *       404:
     *         description: Item not found
     *       500:
     *         description: Internal server error
     */
    .delete(userAuth, itemOwnerCheck, async (req, res) => {
        const { item, user } = res.locals
        const { quantity } = req.query

        if (!item) {
            res.status(404).send()
            return;
        }

        try {
            await consumeItem(item.inventoryId, Number(quantity));


            if (item.type == 'case') {
                await consumeCase(user, item.inventoryId, item.itemId)
            }

            res.status(200).send()
        } catch (err) {
            console.error(err);
            res.status(500).send()
        }
    })

export default router