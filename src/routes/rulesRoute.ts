import express from 'express'
import rulesController from '@src/controllers/rulesController'

const router = express.Router()

router.route('/')
    /**
     * @openapi
     * "/rules":
     *   get:
     *     tags:
     *       - Rules
     *     summary: Get all rules
     *     responses:
     *       200:
     *         description: Success
     */
    .get((req, res) => rulesController.getRules(req, res))

export default router
