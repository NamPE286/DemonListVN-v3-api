import { getCase as getCaseItems, getItem } from '@src/services/item.service'
import express from 'express'

const router = express.Router()

router.route('/:id')
    /**
     * @openapi
     * "/item/{id}":
     *   get:
     *     tags:
     *       - Item
     *     summary: Get item details by ID
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The ID of the item
     *         required: true
     *         schema:
     *           type: integer
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