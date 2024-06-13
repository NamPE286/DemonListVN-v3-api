import { getClans } from '@src/lib/client'
import express from 'express'

const router = express.Router()

router.route('/')
    /**
     * @openapi
     * "/clans":
     *   get:
     *     tags:
     *       - Clan
     *     summary: Get clan list
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
     *           default: name
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
            res.send(await getClans(req.body))
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

export default router