import express from 'express'
import playersController from '@src/controllers/playersController'

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
    .get((req, res) => playersController.getPlayers(req, res))

router.route('/')
    .post((req, res) => playersController.getPlayersBatch(req, res))

export default router