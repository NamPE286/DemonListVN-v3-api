import express from 'express'
import supabase from '@src/database/supabase'

const router = express.Router()

router.route("/new")
    .get(async (req, res) => {
        const { data, error } = await supabase
            .from("levels")
            .select("*")
            .is("rating", null)
            .is("flTop", null)
            .is("insaneTier", null)

        if (error) {
            res.status(500).send();

            return;
        }

        res.send(data)
    })

export default router