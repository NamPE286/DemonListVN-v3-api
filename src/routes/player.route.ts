// For backward compability only

import { updateHeatmap } from '@src/services/heatmap.service'
import express from 'express'
import userAuth from '@src/middleware/user-auth.middleware'

const router = express.Router()

router.route('/heatmap/:count')
    /**
     * @openapi
     * "/player/heatmap/{count}":
     *   post:
     *     tags:
     *       - Player
     *     summary: Add 1 attempt to the heatmap
     *     parameters:
     *       - name: count
     *         in: path
     *         description: Amount of attempt to add
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Success
     */
    .post(userAuth, async (req, res) => {
        try {
            await updateHeatmap(res.locals.user.uid!, parseInt(req.params.count))
        } catch (err) {
            console.error(err)
        }

        res.send()
    })

export default router