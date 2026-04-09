import express from 'express'
import userAuth from '@src/middleware/user-auth.middleware'
import { getDailyCheckinStatus, confirmDailyCheckinReward } from '@src/services/ads.service'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Ads
 *   description: Advertisement and rewards endpoints
 */

/**
 * @swagger
 * /ads/rewards/daily-checkin:
 *   get:
 *     summary: Get daily check-in reward status
 *     tags: [Ads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daily check-in status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 claimed:
 *                   type: boolean
 *       500:
 *         description: Internal server error
 */
router.route('/rewards/daily-checkin')
    .get(userAuth, async (req, res) => {
        const { user } = res.locals
        try {
            const status = await getDailyCheckinStatus(user.uid!)
            res.send(status)
        } catch (err: any) {
            console.error(err)
            res.status(err.statusCode || 500).send({ message: err.message })
        }
    })

/**
 * @swagger
 * /ads/rewards/confirm:
 *   get:
 *     summary: Confirm daily check-in reward (Google Ads callback)
 *     tags: [Ads]
 *     description: Server-side callback called by Google after a rewarded ad is completed
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: reward_type
 *         schema:
 *           type: string
 *         description: Type of reward
 *       - in: query
 *         name: reward_amount
 *         schema:
 *           type: integer
 *         description: Amount of reward
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         description: Verification token
 *       - in: query
 *         name: timestamp
 *         schema:
 *           type: integer
 *         description: Timestamp of the reward
 *     responses:
 *       200:
 *         description: Reward confirmed or already claimed
 *       400:
 *         description: Missing user_id
 *       500:
 *         description: Internal server error
 */
router.route('/rewards/confirm')
    .get(async (req, res) => {
        const { user_id } = req.query

        if (!user_id || typeof user_id !== 'string') {
            res.status(400).send('Missing user_id')
            return
        }

        try {
            await confirmDailyCheckinReward(user_id)
            res.status(200).send('OK')
        } catch (err: any) {
            console.error('[Ads] Reward confirm failed:', err.message)
            // Return 200 even on already-claimed to prevent Google retries
            if (err.statusCode === 400) {
                res.status(200).send('Already claimed')
                return
            }
            res.status(500).send(err.message)
        }
    })

export default router
