import express from 'express'
import userAuth from '@src/middleware/userAuth'
import submissionController from '@src/controllers/submissionController'

const router = express.Router()

router.route('/')
    /**
      * @openapi
      * "/submission":
      *   POST:
      *     tags:
      *       - Submission
      *     summary: Add or edit a submission
      *     requestBody:
      *         required: true
      *         content:
      *             application/json:
      *     responses:
      *       200:
      *         description: Success
     */
    .post(userAuth, submissionController.submitRecord.bind(submissionController))

export default router
