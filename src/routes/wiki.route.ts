import { getWikis, getLatestWikiFiles } from '@src/services/wiki.service'
import express from 'express'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Wiki
 *   description: Wiki file endpoints
 */

/**
 * @swagger
 * /wiki/latest:
 *   get:
 *     summary: Get latest wiki files
 *     tags: [Wiki]
 *     parameters:
 *       - in: query
 *         name: locale
 *         schema:
 *           type: string
 *         description: Comma-separated list of locales (e.g., 'en,vi')
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *         description: Maximum number of wiki files to return
 *     responses:
 *       200:
 *         description: Latest wiki files retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.route('/latest')
    .get(async (req, res) => {
        // @ts-ignore
        const locales = req.query.locale?.split(',')
        const limit = req.query.limit ? Number(req.query.limit) : 8

        res.send(await getLatestWikiFiles(locales, limit))
    })

/**
 * @swagger
 * /wiki/files/{path}:
 *   get:
 *     summary: Get wiki files by path
 *     tags: [Wiki]
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Wiki file path
 *       - in: query
 *         name: locale
 *         schema:
 *           type: string
 *         description: Comma-separated list of locales
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: created_at
 *         description: Field to sort by
 *       - in: query
 *         name: ascending
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Sort order
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Limit for pagination
 *     responses:
 *       200:
 *         description: Wiki files retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.route('/files/*path')
    .get(async (req, res) => {
        // @ts-ignore
        const locales = req.query.locale?.split(',')
        // @ts-ignore
        const path: string = req.params.path.join('/').replace(/\/+$/, '')
        const filter: any = {
            sortBy: req.query.sortBy || 'created_at',
            ascending: req.query.ascending || false,
            offset: req.query.offset ? Number(req.query.offset) : 0,
            limit: req.query.limit ? Number(req.query.limit) : 10
        }

        res.send(await getWikis(path, locales, filter))
    })

export default router;