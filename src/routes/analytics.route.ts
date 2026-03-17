import { getRevenueAnalytics } from '@src/services/analytics.service'
import adminAuth from '@src/middleware/admin-auth.middleware'
import express from 'express'

const router = express.Router()

router.route('/revenue')
    .get(adminAuth, async (req, res) => {
        const { period = '30d' } = req.query

        try {
            const data = await getRevenueAnalytics(String(period))
            res.send(data)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

export default router
