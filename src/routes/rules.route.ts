import supabase from '@src/client/supabase';
import express from 'express'

const router = express.Router()

router.route('/')
    /**
     * @openapi
     * "/rules":
     *   get:
     *     tags:
     *       - Rules
     *     summary: Get all rules
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     *       500:
     *         description: Internal server error
     */
    .get(async (req, res) => {
        const { data, error } = await supabase
            .from('rules')
            .select('*')

        if (error) {
            res.status(500).send()
        }

        res.send(data);
    })

export default router;