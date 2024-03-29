import express from 'express'
import Record from '@lib/classes/Record'
import adminAuth from '@src/middleware/adminAuth'
import userAuth from '@src/middleware/userAuth'

const router = express.Router()

router.route('/')
    /**
     * @openapi
     * "/record":
     *   put:
     *     tags:
     *       - Record
     *     summary: Add or update a record
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .put(adminAuth, async (req, res) => {
        try {
            const record = new Record(req.body)
            await record.update()
    
            res.send()
        } catch(err) {
            res.status(500).send(err)
        }
    })

router.route('/:userID/:levelID')
    /**
     * @openapi
     * "/record/{userID}/{levelID}":
     *   delete:
     *     tags:
     *       - Record
     *     summary: Delete a single record
     *     parameters:
     *       - name: userID
     *         in: path
     *         description: The uid of the player
     *         required: true
     *         schema:
     *           type: string
     *       - name: levelID
     *         in: path
     *         description: The id of the level
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Success
     */
    .delete(userAuth, async (req, res) => {
        const { user } = res.locals
        const { userID, levelID } = req.params

        if (user.data.uid != userID && !user.data.isAdmin) {
            res.status(403).send()
            return
        }

        try {
            const record = new Record({userid: userID, levelid: parseInt(levelID)})
            await record.delete()
    
            res.send()
        } catch(err) {
            res.status(500).send(err)
        }
    })

export default router