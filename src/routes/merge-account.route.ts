import express from 'express'
import supabase from '@src/client/supabase'
import adminAuth from '@src/middleware/admin-auth.middleware'

const router = express.Router()

/**
 * @openapi
 * "/mergeAccount/:a/:b":
 *   patch:
 *     tags:
 *       - Others
 *     summary: Merge player A to B (assign all data of A to B and delete player A)
 *     parameters:
 *       - name: a
 *         in: path
 *         description: Player A UID
 *         required: true
 *         schema:
 *           type: string
 *       - name: b
 *         in: path
 *         description: Player B UID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/:a/:b')
    .patch(adminAuth, async (req, res) => {
        const { a, b } = req.params

        var { data, error } = await supabase
            .from('records')
            .update({ userid: b })
            .eq('userid', a)

        if(error) {
            res.status(500).send(error)
            return
        }

        var { error } = await supabase
            .from('players')
            .delete()
            .match({ uid: a })

        if(error) {
            res.status(500).send(error)
            return
        }

        await supabase.rpc('update_rank')

        res.send()
    })

export default router