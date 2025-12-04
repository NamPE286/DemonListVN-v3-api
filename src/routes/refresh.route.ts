import express from 'express'
import supabase from '@src/client/supabase'
import adminAuth from '@src/middleware/admin-auth.middleware'

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
        const a = await supabase.rpc('update_rank')

        if (a.error) {
            console.error(a.error)
            res.status(500).send()
            return
        }

        const b = await supabase.rpc('update_list')

        if (b.error) {
            console.error(b.error)
            res.status(500).send()
            return
        }

        res.send()
    })

export default router