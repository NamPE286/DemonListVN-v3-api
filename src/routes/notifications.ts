import express from 'express'
import { clearPlayerNotifications, getPlayerNotifications } from '@src/lib/client'
import userAuth from '@src/middleware/userAuth'

const router = express.Router()

router.route('/:uid')
    /**
      * @openapi
      * "/notifications/{uid}":
      *   get:
      *     tags:
      *       - Notification
      *     summary: Get a player's notifications
      *     parameters:
      *       - name: uid
      *         in: path
      *         description: The uid of the player
      *         required: true
      *         schema:
      *           type: string
      *     responses:
      *       200:
      *         description: Success
      *         content:
      *           application/json:
      *             schema:
      */
    .get(userAuth, async (req, res) => {
        const { uid } = req.params
        const { user } = res.locals

        if (user.data.uid != uid && !user.data.isAdmin) {
            res.status(403).send()
            return
        }

        res.send(await getPlayerNotifications(uid))
    })

    /**
      * @openapi
      * "/notifications/{uid}":
      *   delete:
      *     tags:
      *       - Notification
      *     summary: Clear a player's notification
      *     parameters:
      *       - name: uid
      *         in: path
      *         description: The uid of the player
      *         required: true
      *         schema:
      *           type: string
      *     responses:
      *       200:
      *         description: Success
     */
    .delete(userAuth, async (req, res) => {
        const { uid } = req.params
        const { user } = res.locals

        if (user.data.uid != uid && !user.data.isAdmin) {
            res.status(403).send()
            return
        }

        res.send(await clearPlayerNotifications(uid))
    })

export default router