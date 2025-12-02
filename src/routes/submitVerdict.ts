import express from 'express'
import userAuth from '@src/middleware/userAuth'
import submitVerdictController from '@src/controllers/submitVerdictController'

const router = express.Router()

router.route('/')
    /**
      * @openapi
      * "/submitVerdict":
      *   PUT:
      *     tags:
      *       - Verdict
      *     summary: Submit a verdict from trusted player
      *     requestBody:
      *         required: true
      *         content:
      *             application/json:
      *     responses:
      *       200:
      *         description: Success
     */
    .put(userAuth, submitVerdictController.submitVerdict.bind(submitVerdictController))

export default router
