import { getRecordCard } from '@src/services/card.service'
import express from 'express'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Record Card
 *   description: Record card endpoints
 */

/**
 * @swagger
 * /record-card/{id}:
 *   get:
 *     summary: Get a record card by ID
 *     tags: [Record Card]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Record card ID
 *     responses:
 *       200:
 *         description: Record card retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Record card not found
 */
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
