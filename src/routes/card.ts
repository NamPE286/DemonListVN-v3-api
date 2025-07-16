import { getCard, linkCard, updateCardContent } from '@src/lib/client/card'
import userAuth from '@src/middleware/userAuth'
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

router.route("/:id/link")
    .patch(userAuth, async (req, res) => {
        const { id } = req.params
        const { user } = res.locals

        try {
            await linkCard(id, user)
            res.send()
        } catch (err) {
            console.log(err)
            res.status(500).send()
        }

        res.send()
    })

router.route("/:id/content")
    .patch(userAuth, async (req, res) => {
        const { id } = req.params

        try {
            await updateCardContent(id, req.body.content)
            res.send()
        } catch (err) {
            console.log(err)
            res.status(500).send()
        }

        res.send()
    })

export default router