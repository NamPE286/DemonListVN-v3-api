import { getRevenueAnalytics } from '@src/services/analytics.service'
import adminAuth from '@src/middleware/admin-auth.middleware'
import express from 'express'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Analytics and metrics endpoints
 */

/**
 * @swagger
 * /analytics/revenue:
 *   get:
 *     summary: Get revenue analytics data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: 30d
 *         description: Time period for analytics (e.g., 7d, 30d, 90d)
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (ISO format)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (ISO format)
 *     responses:
 *       200:
 *         description: Revenue analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       403:
 *         description: Forbidden - user is not admin or manager
 *       500:
 *         description: Internal server error
 */
router.route('/revenue')
    .get(adminAuth, async (req, res) => {
        const player = res.locals.user
        if (!player.isAdmin && !player.isManager) {
            res.status(403).send()
            return
        }

        const { period = '30d', from, to } = req.query

        try {
            const data = await getRevenueAnalytics(
                String(period),
                from ? String(from) : undefined,
                to ? String(to) : undefined
            )
            res.send(data)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

export default router
