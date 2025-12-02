import express from 'express'
import adminAuth from '@src/middleware/adminAuth'
import refreshController from '@src/controllers/refreshController'

const router = express.Router()

router.route('/')
    /**
     * @openapi
     * "/refresh":
     *   patch:
     *     tags:
     *       - Others
     *     summary: Recalculate all player and level rank
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .patch(adminAuth, (req, res) => refreshController.refreshRanks(req, res))

export default router
