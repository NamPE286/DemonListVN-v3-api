import express from "express";
import { getDemonListLevels, getDemonListRecords, getFeaturedListLevels, getFeaturedListRecords } from '@lib/client/index'

const router = express.Router()

router.use((req, res, next) => {
    res.set('Cache-Control', 'public, s-maxage=180, max-age=180')
    next()
})

router.route('/dl')
    /**
     * @openapi
     * "/list/dl":
     *   get:
     *     tags:
     *       - List
     *     summary: Get all records of the Demon List
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
     *       - name: sortBy
     *         in: query
     *         description: Property of level to sort by
     *         required: false
     *         schema:
     *           type: string
     *           default: dlTop
     *       - name: ascending
     *         in: query
     *         description: Sort ascending
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
            res.send(await getDemonListLevels(req.query))
        } catch (err) {
            res.status(500).send()
        }
    })

router.route('/fl')
    /**
     * @openapi
     * "/list/fl":
     *   get:
     *     tags:
     *       - List
     *     summary: Get all records of the Demon List
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
     *       - name: sortBy
     *         in: query
     *         description: Property of level to sort by
     *         required: false
     *         schema:
     *           type: string
     *           default: flTop
     *       - name: ascending
     *         in: query
     *         description: Sort ascending
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
            res.send(await getFeaturedListLevels(req.query))
        } catch (err) {
            res.status(500).send()
        }
    })

router.route('/dl/records')
    /**
     * @openapi
     * "/list/dl/records":
     *   get:
     *     tags:
     *       - List
     *     summary: Get all records of the Demon List
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
     *           default: true
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(async (req, res) => {
        try {
            res.send(await getDemonListRecords(req.query))
        } catch (err) {
            res.status(500).send()
        }
    })

router.route('/fl/records')
    /**
     * @openapi
     * "/list/fl/records":
     *   get:
     *     tags:
     *       - List
     *     summary: Get all records of the Featured List
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
     *           default: true
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(async (req, res) => {
        try {
            res.send(await getFeaturedListRecords(req.query))
        } catch(err) {
            res.status(500).send()
        }
    })

export default router