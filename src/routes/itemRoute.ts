import express from 'express'
import itemController from '@src/controllers/itemController'

const router = express.Router()

router.route('/:id')
    /**
     * @openapi
     * "/item/{id}":
     *   get:
     *     tags:
     *       - Item
     *     summary: Get an item by ID
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The ID of the item
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Success
     */
    .get((req, res) => itemController.getItem(req, res))

export default router
