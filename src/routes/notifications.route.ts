import express from 'express'
import { clearPlayerNotifications, getPlayerNotifications, sendNotification } from '@src/services/notification.service'
import userAuth from '@src/middleware/userAuth.middleware'
import adminAuthMiddleware from '@src/middleware/adminAuth.middleware'

const router = express.Router()

router.route('/')
    /**
      * @openapi
      * "/notification":
      *   post:
      *     tags:
      *       - Notification
      *     summary: Send a notification
      *     requestBody:
      *         required: true
      *         content:
      *             application/json:
      *     responses:
      *       200:
      *         description: Success
     */
    .post(adminAuthMiddleware, async (req, res) => {
        try {
            await sendNotification(req.body)
            res.send()
        } catch(err) {
            res.status(500).send()
        }
    })

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

        if (user.uid != uid && !user.isAdmin) {
            res.status(403).send()
            return
        }

        try {
            res.send(await getPlayerNotifications(uid))
        } catch (err) {
            res.status(500).send()
        }
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

        if (user.uid != uid && !user.isAdmin) {
            res.status(403).send()
            return
        }

        try {
            res.send(await clearPlayerNotifications(uid))
        } catch(err) {
            res.status(500).send()
        }

    })

export default router