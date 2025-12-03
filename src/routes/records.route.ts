import express from 'express'
import { getRecords } from '@src/services/record.service'

const router = express.Router()

router.route('/')
    /**
     * @openapi
     * "/records":
     *   get:
     *     tags:
     *       - Record
     *     summary: Get all records of all list
     *     parameters:
     *       - name: start
     *         in: query
     *         description: Range start index
     *         required: false
     *         schema:
     *           type: number
     *           default: 0
     *       - name: end
     *         in: query
     *         description: Range end index
     *         required: false
     *         schema:
     *           type: number
     *           default: 50
     *       - name: isChecked
     *         in: query
     *         description: Record acception status
     *         required: false
     *         schema:
     *           type: boolean
     *           default: false
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(async (req, res) => {
        try {
            res.send(await getRecords(req.query))
        } catch (err) {
            res.status(500).send()
        }
    })

export default router