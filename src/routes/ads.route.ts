import express from 'express'
import userAuth from '@src/middleware/user-auth.middleware'
import { getDailyCheckinStatus, confirmDailyCheckinReward } from '@src/services/ads.service'

const router = express.Router()

/**
 * GET /ads/rewards/daily-checkin
 * Returns the user's daily check-in status.
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
 * GET /ads/rewards/confirm
 * Server-side callback called by Google after a rewarded ad is completed.
 * Query params: user_id, reward_type, reward_amount, token, timestamp
 * Google expects a 200 response to confirm delivery.
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
