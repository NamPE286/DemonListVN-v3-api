import express from 'express'
import supabase from '@database/supabase'
import adminAuth from '@src/middleware/adminAuth'

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
    .patch(adminAuth, async (req, res) => {
        await supabase.rpc('updateRank')
        await supabase.rpc('updateList')

        res.send()
    })

export default router