import express from 'express'
import adminAuth from '@src/middleware/adminAuth'
import notificationController from '@src/controllers/notificationController'

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
    .post(adminAuth, (req, res) => notificationController.sendNotification(req, res))

export default router
