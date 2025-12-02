import express from 'express'
import userAuth from '@src/middleware/userAuth'
import notificationsController from '@src/controllers/notificationsController'

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
    .get(userAuth, (req, res) => notificationsController.getPlayerNotifications(req, res))

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
    .delete(userAuth, (req, res) => notificationsController.clearPlayerNotifications(req, res))

export default router
