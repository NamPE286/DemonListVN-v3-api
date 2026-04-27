import { syncWiki } from '@src/services/sync.service'
import express from 'express'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Sync
 *   description: Data synchronization endpoints
 */

/**
 * @swagger
 * /sync/wiki:
 *   post:
 *     summary: Sync wiki data
 *     tags: [Sync]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - commit_id
 *             properties:
 *               commit_id:
 *                 type: string
 *                 description: The commit ID to sync wiki data from
 *     responses:
 *       200:
 *         description: Wiki sync successful
 *       400:
 *         description: Bad request - missing commit_id
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.route('/wiki')
    .post(async (req, res) => {
        try {
            const { commit_id: commitId } = req.body

            await syncWiki(commitId)

            res.send()
        } catch (err: any) {
            console.error(err);
            
            res.status(500).send({
                error: err.message
            })
        }

    })

export default router