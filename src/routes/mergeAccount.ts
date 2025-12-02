import express from 'express'
import adminAuth from '@src/middleware/adminAuth'
import mergeAccountController from '@src/controllers/mergeAccountController'

const router = express.Router()

/**
 * @openapi
 * "/mergeAccount/:a/:b":
 *   patch:
 *     tags:
 *       - Others
 *     summary: Merge player A to B (assign all data of A to B and delete player A)
 *     parameters:
 *       - name: a
 *         in: path
 *         description: Player A UID
 *         required: true
 *         schema:
 *           type: string
 *       - name: b
 *         in: path
 *         description: Player B UID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/:a/:b')
    .patch(adminAuth, mergeAccountController.mergeAccounts.bind(mergeAccountController))

export default router
