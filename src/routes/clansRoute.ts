import express from 'express'
import clansController from '@src/controllers/clansController'

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
     *       - name: searchQuery
     *         in: query
     *         description: Search query
     *         required: false
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get((req, res) => clansController.getClans(req, res))

export default router
