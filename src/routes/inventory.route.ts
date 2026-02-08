import userAuth from '@src/middleware/user-auth.middleware'
import itemOwnerCheck from '@src/middleware/item-owner-check.middleware'
import express from 'express'
import { consumeItem } from '@src/services/inventory.service'
import supabase from '@src/client/supabase'
import { getPlayerInventoryItems } from '@src/services/player.service'
import { consumeCase, consumeQueueBoost } from '@src/services/item-consumer.service'
import { ItemId } from '@src/const/item-id-const'

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
     *     parameters:
     *       - name: itemType
     *         in: query
     *         description: Filter by item type
     *         schema:
     *           type: string
     *       - name: itemId
     *         in: query
     *         description: Filter by item ID
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
    .get(userAuth, async (req, res) => {
        const { user } = res.locals
        const { itemType, itemId } = req.query

        try {
            const filters = {
                ...(itemType && { itemType: itemType as string }),
                ...(itemId && { itemId: Number(itemId) })
            }

            const items = await getPlayerInventoryItems(user.uid, Object.keys(filters).length > 0 ? filters : undefined);
            
            res.send(items);
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

router.route('/item/:id/consume')
    .delete(userAuth, async (req, res) => {
        const { user } = res.locals
        const { id } = req.params

        try {
            if (Number(id) == ItemId.QUEUE_BOOST) {
                const { levelID, quantity } = req.body

                await consumeQueueBoost(user.uid, Number(levelID), Number(quantity));
            }

            res.send()
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

        if (!item) {
            res.status(404).send()
            return;
        }

        try {
            let result: any;

            if (item.type == 'case') {
                result = await consumeCase(user, item.inventoryId, item.itemId)
            }

            res.send(result)
        } catch (err) {
            console.error(err);
            res.status(500).send()
        }
    })

export default router