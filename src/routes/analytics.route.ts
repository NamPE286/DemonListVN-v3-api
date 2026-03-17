import { getRevenueAnalytics } from '@src/services/analytics.service'
import adminAuth from '@src/middleware/admin-auth.middleware'
import express from 'express'

const router = express.Router()

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
