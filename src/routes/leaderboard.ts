import express from 'express'
import { getDemonListLeaderboard, getFeaturedListLeaderboard } from '@src/lib/client'

const router = express.Router()

router.use((req, res, next) => {
    res.set('Cache-Control', 'public, s-maxage=180, max-age=180')
    next()
})

router.route('/dl')
    /**
     * @openapi
     * "/leaderboard/dl":
     *   get:
     *     tags:
     *       - Leaderboard
     *     summary: Get leaderboard of Demon List
     *     parameters:
     *       - name: start
     *         in: query
     *         description: Range start index
     *         required: false
     *         schema:
     *           type: number
     *           default: 0
     *       - name: end
     *         in: query
     *         description: Range end index
     *         required: false
     *         schema:
     *           type: number
     *           default: 50
     *       - name: sortBy
     *         in: query
     *         description: Property of level to sort by
     *         required: false
     *         schema:
     *           type: string
     *           default: overallRank
     *       - name: ascending
     *         in: query
     *         description: Sort ascending
     *         required: false
     *         schema:
     *           type: boolean
     *           default: false
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(async (req, res) => {
        try {
            res.send(await getDemonListLeaderboard(req.query))
        } catch (err) {
            res.status(500).send()
        }
    })

router.route('/fl')
    /**
     * @openapi
     * "/leaderboard/fl":
     *   get:
     *     tags:
     *       - Leaderboard
     *     summary: Get leaderboard of Featured List
     *     parameters:
     *       - name: start
     *         in: query
     *         description: Range start index
     *         required: false
     *         schema:
     *           type: number
     *           default: 0
     *       - name: end
     *         in: query
     *         description: Range end index
     *         required: false
     *         schema:
     *           type: number
     *           default: 50
     *       - name: sortBy
     *         in: query
     *         description: Property of level to sort by
     *         required: false
     *         schema:
     *           type: string
     *           default: flrank
     *       - name: ascending
     *         in: query
     *         description: Sort ascending
     *         required: false
     *         schema:
     *           type: boolean
     *           default: false
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(async (req, res) => {
        try {
            res.send(await getFeaturedListLeaderboard(req.query))
        } catch (err) {
            res.status(500).send()
        }
    })

export default router