import express from 'express'
import adminAuth from '@src/middleware/adminAuth'
import changelogsController from '@src/controllers/changelogsController'

const router = express.Router()

router.route('/publish')
    /**
     * @openapi
     * "/changelogs/publish":
     *   post:
     *     tags:
     *       - Changelogs
     *     summary: Publish changelogs
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *     responses:
     *       200:
     *         description: Success
     */
    .post(adminAuth, (req, res) => changelogsController.publishChangelogs(req, res))

export default router
