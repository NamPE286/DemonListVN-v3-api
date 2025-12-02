import express from 'express'
import userAuth from '@src/middleware/userAuth'
import storageController from '@src/controllers/storageController'

const router = express.Router()

router.route('/presign')
    /**
     * @openapi
     * "/storage/presign":
     *   get:
     *     tags:
     *       - Storage
     *     summary: Get a presigned URL for file upload
     *     responses:
     *       200:
     *         description: Success
     */
    .get(userAuth, (req, res) => storageController.getPresignedUrl(req, res))

export default router
