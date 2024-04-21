import { updateHeatmap } from '@src/lib/client/updateHeatmap'
import userAuth from '@src/middleware/userAuth'
import express from 'express'

const router = express.Router()

router.route('/')
    /**
     * @openapi
     * "/updateHeatmap":
     *   post:
     *     tags:
     *       - Others
     *     summary: Add 1 attempt to the heatmap
     *     responses:
     *       200:
     *         description: Success
     */
    .post(userAuth, async (req, res) => {
        try {
            updateHeatmap(res.locals.user.data.uid)
            res.send()
        } catch {
            res.status(500).send()
        }
    })

export default router