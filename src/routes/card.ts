import { getCard } from '@src/lib/client/card'
import express from 'express'

const router = express.Router()

router.route("/:id")
    .get(async (req, res) => {
        const { id } = req.params

        try {
            const card = await getCard(id)
            res.send(card)
        } catch (err) {
            console.log(err)
            res.status(500).send()
        }
    })

export default router