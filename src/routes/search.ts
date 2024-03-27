import express from 'express'
import { search } from '@lib/client'

const router = express.Router()

router.route(':query')
    .get(async (req, res) => {
        const { query } = req.params

        res.send({
            levels: await search.levels(query),
            players: await search.players(query)
        })
    })

export default router