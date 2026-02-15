import express from 'express'
import { search } from '@src/services/search.service'
import optionalAuth from '@src/middleware/optional-user-auth.middleware'

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
    .get(optionalAuth, async (req, res) => {
        const { query } = req.params
        const isAdmin = !!res.locals.authenticated && !!res.locals.user?.isAdmin

        res.send({
            levels: await search.levels(query, req.query),
            players: await search.players(query, {
                ...req.query,
                includeHidden: isAdmin
            })
        })
    })

export default router