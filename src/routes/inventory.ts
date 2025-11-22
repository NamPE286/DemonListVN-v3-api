import userAuth from '@src/middleware/userAuth'
import itemOwnerCheck from '@src/middleware/itemOwnerCheck'
import express from 'express'
import { consumeCase } from '@src/lib/client/inventory'

const router = express.Router()

router.route('/')
    .get(userAuth, async (req, res) => {
        const { user } = res.locals

        try {
            res.send(await user.getInventoryItems());
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
                res.status(501).send()
            }
        } catch (err) {
            console.error(err);
            res.status(500).send()
        }
    })

export default router