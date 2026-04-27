import { getSupporterRevenueProgress, getTopBuyers } from '@src/services/player.service'
import express from 'express'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Buyers
 *   description: Top buyers and supporter progress
 */

/**
 * @swagger
 * /buyers/top:
 *   get:
 *     summary: Get top buyers by revenue
 *     tags: [Buyers]
 *     parameters:
 *       - in: query
 *         name: interval
 *         schema:
 *           type: integer
 *           default: 2592000000
 *         description: Time interval in milliseconds
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 1000
 *         description: Maximum number of buyers to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: List of top buyers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.route('/top')
    .get(async (req, res) => {
        const { interval = 2592000000, limit = 1000, offset = 0 } = req.query

        res.send(await getTopBuyers(
            parseInt(String(interval)),
            parseInt(String(limit)),
            parseInt(String(offset))
        ))
    })

/**
 * @swagger
 * /buyers/progress:
 *   get:
 *     summary: Get supporter revenue progress
 *     tags: [Buyers]
 *     parameters:
 *       - in: query
 *         name: interval
 *         schema:
 *           type: integer
 *           default: 2592000000
 *         description: Time interval in milliseconds
 *     responses:
 *       200:
 *         description: Supporter revenue progress data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 serverCostPercent:
 *                   type: number
 *                 minecraftServerPercent:
 *                   type: number
 */
router.route('/progress')
    .get(async (req, res) => {
        const { interval = 2592000000 } = req.query

        res.send(await getSupporterRevenueProgress(parseInt(String(interval))))
    })

export default router