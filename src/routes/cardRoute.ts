import userAuth from '@src/middleware/userAuth'
import express from 'express'
import cardController from '@src/controllers/cardController'

const router = express.Router()

router.route('/:id')
    /**
     * @openapi
     * "/card/{id}":
     *   get:
     *     tags:
     *       - Card
     *     summary: Get a card by ID
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
     */
    .get((req, res) => cardController.getCard(req, res))

router.route('/:id/link')
    /**
     * @openapi
     * "/card/{id}/link":
     *   patch:
     *     tags:
     *       - Card
     *     summary: Link a card to a player
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
     */
    .patch(userAuth, (req, res) => cardController.linkCard(req, res))

router.route('/:id/content')
    /**
     * @openapi
     * "/card/{id}/content":
     *   patch:
     *     tags:
     *       - Card
     *     summary: Update card content
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
     *     responses:
     *       200:
     *         description: Success
     */
    .patch(userAuth, (req, res) => cardController.updateCardContent(req, res))

export default router
