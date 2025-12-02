import express from 'express'
import userAuth from '@src/middleware/userAuth'
import deathCountController from '@src/controllers/deathCountController'

const router = express.Router()

router.route('/:uid/:levelID')
    /**
     * @openapi
     * "/deathCount/{uid}/{levelID}":
     *   get:
     *     tags:
     *       - Death count
     *     summary: Get player's level death count
     *     parameters:
     *       - name: uid
     *         in: path
     *         description: The uid of the player
     *         required: true
     *         schema:
     *           type: string
     *       - name: levelID
     *         in: path
     *         description: The id of the level
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(deathCountController.getDeathCount.bind(deathCountController))

router.route('/:levelID/:count')
    /**
     * @openapi
     * "/deathCount/{levelID}/{count}":
     *   post:
     *     tags:
     *       - Death count
     *     summary: Add player's level death count
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The id of the level
     *         required: true
     *         schema:
     *           type: number
     *       - name: count
     *         in: path
     *         description: Serialized array string
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .post(userAuth, deathCountController.updateDeathCount.bind(deathCountController))

export default router
