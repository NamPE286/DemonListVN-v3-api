import express from 'express'
import provincesController from '@src/controllers/provincesController'

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
    .get((req, res) => provincesController.getProvinces(req, res))

export default router
