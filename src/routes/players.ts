import express from 'express'
import { getPlayers } from '@src/lib/client/index'

const router = express.Router()

router.route('/')
    /**
     * @openapi
     * "/players":
     *   get:
     *     tags:
     *       - Player
     *     summary: Get all players matched filter
     *     parameters:
     *       - name: province
     *         in: query
     *         description: Province name
     *         required: true
     *         schema:
     *           type: string
     *       - name: city
     *         in: query
     *         description: City name
     *         required: false
     *         schema:
     *           type: string
     *       - name: sortBy
     *         in: query
     *         description: Property of level to sort by
     *         required: false
     *         schema:
     *           type: string
     *           default: rating
     *       - name: ascending
     *         in: query
     *         description: Sort ascending
     *         required: false
     *         schema:
     *           type: boolean
     *           default: true
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(async (req, res) => {
        try {
            res.send(await getPlayers(req.query))
        } catch {
            res.status(500).send()
        }
    })

export default router