import userAuth from '@src/middleware/user-auth.middleware'
import itemOwnerCheck from '@src/middleware/item-owner-check.middleware'
import express from 'express'
import { consumeCase } from '@src/services/inventory.service'
import supabase from '@src/client/supabase'
import { getPlayerInventoryItems } from '@src/services/player.service'

const router = express.Router()

router.route('/')
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
    .get(userAuth, itemOwnerCheck, async (req, res) => {
        try {
            res.send(res.locals.item);
        } catch (err) {
            console.error(err);
            res.status(500).send()
        }
    })

router.route('/:id/consume')
    .delete(userAuth, itemOwnerCheck, async (req, res) => {
        const { item, user } = res.locals

        if (!item) {
            res.status(404).send()
            return;
        }

        try {
            if (item.type == 'case') {
                res.send(await consumeCase(user, item.inventoryId, item.itemId))
            } else {
                var { error } = await supabase
                    .from('inventory')
                    .update({ consumed: true })
                    .eq('id', item.inventoryId)

                if (error) {
                    console.error(error)
                    res.status(500).send()

                    return;
                }

                res.status(200).send()
            }
        } catch (err) {
            console.error(err);
            res.status(500).send()
        }
    })

export default router