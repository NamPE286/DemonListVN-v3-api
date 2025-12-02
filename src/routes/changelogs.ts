import express from 'express'
import adminAuth from '@src/middleware/adminAuth'
import changelogsController from '@src/controllers/changelogsController'

const router = express.Router()

router.route('/publish')
    .post(adminAuth, changelogsController.publishChangelogs.bind(changelogsController))

export default router
