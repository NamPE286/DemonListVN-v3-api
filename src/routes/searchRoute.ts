import express from 'express'
import searchController from '@src/controllers/searchController'

const router = express.Router()

router.route('/:query')
    /**
     * @openapi
     * "/search/{query}":
     *   get:
     *     tags:
     *       - Search
     *     summary: Search for levels and players
     *     parameters:
     *       - name: query
     *         in: path
     *         description: Search query
     *         required: true
     *         schema:
     *           type: string
     *       - name: limit
     *         in: query
     *         description: Length of result
     *         required: false
     *         schema:
     *           type: number
     *           default: 5
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get((req, res) => searchController.search(req, res))

export default router
