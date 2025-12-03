import supabase from '@src/client/supabase';
import express from 'express'

const router = express.Router()

router.route('/')
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