import express from 'express'
import userAuth from '@src/middleware/userAuth'
import storageController from '@src/controllers/storageController'

const router = express.Router()

router.route('/presign')
    .get(userAuth, (req, res) => storageController.getPresignedUrl(req, res))

export default router
