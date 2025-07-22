import express from 'express'
import { getPlayers, getPlayersBatch } from '@src/lib/client/player'

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

router.route('/')
    .post(async (req, res) => {
        const { batch } = req.body

        if (batch) {
            try {
                res.send(await getPlayersBatch(batch))
            } catch {
                res.status(500).send()
            }

            return;
        }
    })

export default router