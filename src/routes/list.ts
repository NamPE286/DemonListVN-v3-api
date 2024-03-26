import express from "express";
import { getDemonListLevels, getDemonListSubmissions, getFeaturedListLevels, getFeaturedListSubmissions } from '@lib/client'

const router = express.Router()

router.route('/DL')
    /**
     * @openapi
     * "/list/DL":
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
        res.send(await getDemonListLevels(req.query))
    })

router.route('/FL')
    /**
     * @openapi
     * "/list/FL":
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
        res.send(await getFeaturedListLevels(req.query))
    })

router.route('/DL/submissions')
    /**
     * @openapi
     * "/list/DL/submissions":
     *   get:
     *     tags:
     *       - List
     *     summary: Get all submission of the Demon List
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
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(async (req, res) => {
        res.send(await getDemonListSubmissions(req.query))
    })

router.route('/FL/submissions')
    /**
     * @openapi
     * "/list/FL/submissions":
     *   get:
     *     tags:
     *       - List
     *     summary: Get all submission of the Featured List
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
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(async (req, res) => {
        res.send(await getFeaturedListSubmissions(req.query))

    })

export default router