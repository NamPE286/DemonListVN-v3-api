import express from 'express'
import userAuth from '@src/middleware/userAuth'
import { createAPIKey, deleteAPIKey, getAllAPIKey } from '@src/lib/client/APIKey'

const router = express.Router()

router.route('/')
    /**
     * @openapi
     * "/APIKey":
     *   get:
     *     tags:
        *       - API key
     *     summary: Get all player API key
     *     responses:
     *       200:
     *         description: Success
     */
    .get(userAuth, async (req, res) => {
        if(res.locals.authType == 'key') {
            res.status(403).send()
            return
        }
        
        try {
            res.send(await getAllAPIKey(res.locals.user.data.uid!))
        } catch (err) {
            res.status(500).send()
        }
    })
    /**
     * @openapi
     * "/APIKey":
     *   post:
     *     tags:
     *       - API key
     *     summary: Create a new API key
     *     responses:
     *       200:
     *         description: Success
     */
    .post(userAuth, async (req, res) => {
        if(res.locals.authType == 'key') {
            res.status(403).send()
            return
        }
        
        try {
            await createAPIKey(res.locals.user.data.uid!)
            res.send()
        } catch (err) {
            res.status(500).send()
        }
    })

router.route('/:key')
    /**
     * @openapi
     * "/APIKey/{key}":
     *   delete:
     *     tags:
     *       - API key
     *     summary: Delete an API key
     *     parameters:
     *       - name: key
     *         in: path
     *         description: API key to delete
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Success
     */
    .delete(userAuth, async (req, res) => {
        if(res.locals.authType == 'key') {
            res.status(403).send()
            return
        }
        
        try {
            await deleteAPIKey(res.locals.user.data.uid!, req.params.key)
            res.send()
        } catch (err) {
            res.status(500).send()
        }
    })

export default router