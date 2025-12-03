import { getCase as getCaseItems, getItem } from '@src/services/item'
import express from 'express'

const router = express.Router()

router.route('/:id')
    .get(async (req, res) => {
        const { id } = req.params

        try {
            const item = await getItem(Number(id))

            if (item.type == 'case') {
                const caseItems = await getCaseItems(Number(id));
                res.send({ ...item, caseItems })
            } else {
                res.send(item)
            }
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

export default router