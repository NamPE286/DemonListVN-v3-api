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
        const a = await supabase.rpc('updateRank')

        if (a.error) {
            console.log(a.error)
            res.status(500).send()
            return
        }

        const b = await supabase.rpc('updateList')

        if (b.error) {
            console.log(b.error)
            res.status(500).send()
            return
        }

        res.send()
    })

export default router