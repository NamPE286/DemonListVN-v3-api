import { getCard, linkCard, updateCardContent, activateCard, getRecordCard, updateRecordCardImg } from '@src/services/card.service'
import userAuth from '@src/middleware/user-auth.middleware'
import managerAuth from '@src/middleware/manager-auth.middleware'
import express from 'express'

const router = express.Router()

router.route("/:id")
    /**
     * @openapi
     * "/card/{id}":
     *   get:
     *     tags:
     *       - Card
     *     summary: Get card by ID
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The ID of the card
     *         required: true
     *         schema:
     *           type: string
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
            const card = await getCard(id)
            res.send(card)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

router.route("/:id/link")
    /**
     * @openapi
     * "/card/{id}/link":
     *   patch:
     *     tags:
     *       - Card
     *     summary: Link a card to user account
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The ID of the card
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Card linked successfully
     *       500:
     *         description: Internal server error
     */
    .patch(userAuth, async (req, res) => {
        const { id } = req.params
        const { user } = res.locals

        try {
            await linkCard(id, user)
            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }

        res.send()
    })

router.route("/:id/activate")
    /**
     * @openapi
     * "/card/{id}/activate":
     *   patch:
     *     tags:
     *       - Card
     *     summary: Activate a card
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The ID of the card
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Card activated successfully
     *       403:
     *         description: Forbidden
     *       500:
     *         description: Internal server error
     */
    .patch(managerAuth, async (req, res) => {
        const { id } = req.params

        try {
            await activateCard(id)
            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

router.route("/:id/content")
    /**
     * @openapi
     * "/card/{id}/content":
     *   patch:
     *     tags:
     *       - Card
     *     summary: Update card content
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The ID of the card
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               content:
     *                 type: string
     *     responses:
     *       200:
     *         description: Card content updated successfully
     *       500:
     *         description: Internal server error
     */
    .patch(userAuth, async (req, res) => {
        const { id } = req.params

        try {
            await updateCardContent(id, req.body.content)
            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }

        res.send()
    })

router.route("/record/:id")
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

router.route("/record/:id/img")
    .patch(userAuth, async (req, res) => {
        const { id } = req.params
        const { user } = res.locals
        const { imgURL } = req.body as { imgURL: string }

        try {
            await updateRecordCardImg(id, user.uid!, imgURL)
            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

export default router