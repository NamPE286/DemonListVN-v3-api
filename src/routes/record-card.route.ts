import { getRecordCard } from '@src/services/card.service'
import express from 'express'

const router = express.Router()

router.route("/:id")
    .get(async (req, res) => {
        const { id } = req.params
        try {
            const card = await getRecordCard(id)
            res.send(card)
        } catch (err) {
            console.error(err)
            res.status(404).send()
        }
    })

export default router
