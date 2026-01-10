import { getCase as getCaseItems, getItem, searchItems } from '@src/services/item.service'
import express from 'express'
import adminAuth from '@src/middleware/admin-auth.middleware'

const router = express.Router()

/**
 * @openapi
 * "/items/search":
 *   get:
 *     tags:
 *       - Item
 *     summary: Search items by name or ID (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: q
 *         in: query
 *         description: Search query (item name or ID)
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
router.route('/search')
    .get(adminAuth, async (req, res) => {
        const { q } = req.query

        if (!q || typeof q !== 'string') {
            res.status(400).send({ message: 'Query parameter q is required' })
            return
        }

        try {
            const items = await searchItems(q)
            res.send(items)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

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