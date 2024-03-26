import express from 'express'
import provinces from '@static/provinces.json'

const router = express.Router()

router.route('/')
    /**
     * @openapi
     * "/provinces":
     *   get:
     *     tags:
     *       - Others
     *     summary: Get a list of all Vietnamese provinces and cities
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
    */
    .get((req, res) => {
        res.send(provinces)
    })

export default router