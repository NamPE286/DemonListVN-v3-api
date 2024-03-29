import express from 'express'
import Level from '@lib/classes/Level'
import adminAuth from '@src/middleware/adminAuth'
import { getLevelRecords } from '@lib/client'

const router = express.Router()

router.use((req, res, next) => {
    if ('id' in req.params) {
        if (isNaN(parseInt(req.params.id))) {
            res.status(400).send({
                message: "Invalid ID (ID should only include numeric character)"
            })

            return
        }
    }

    next()
})

router.route('/')
    /**
      * @openapi
      * "/level":
      *   put:
      *     tags:
      *       - Level
      *     summary: Add or update a level
      *     requestBody:
      *         required: true
      *         content:
      *             application/json:
      *     responses:
      *       200:
      *         description: Success
     */
    .put(adminAuth, async (req, res) => {
        const data = req.body

        if (!('id' in data)) {
            res.status(400).send({
                message: "Missing 'id' property"
            })

            return
        }

        try {
            const level = new Level(data)
            await level.update()

            res.send()
        } catch (err) {
            res.status(500).send(err)
        }
    })

router.route('/:id')
    /**
     * @openapi
     * "/level/{id}":
     *   get:
     *     tags:
     *       - Level
     *     summary: Get a single level by the id
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The id of the level
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(async (req, res) => {
        const { id } = req.params

        try {
            const level = new Level({ id: parseInt(id) })
            await level.pull()

            res.send(level.data)
        } catch {
            res.status(404).send()
        }
    })

    /**
     * @openapi
     * "/level/{id}":
     *   delete:
     *     tags:
     *       - Level
     *     summary: Delete a single level by the id
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The id of the level
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Success
     */
    .delete(adminAuth, async (req, res) => {
        const { id } = req.params

        try {
            const level = new Level({ id: parseInt(id) })
            await level.delete()

            res.send()
        } catch (err) {
            res.status(500).send(err)
        }
    })

router.route('/:id/records')
    /**
     * @openapi
     * "/level/{id}/records":
     *   get:
     *     tags:
     *       - Level
     *     summary: Get all records of a level
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The id of the level
     *         required: true
     *         schema:
     *           type: number
     *       - name: start
     *         in: query
     *         description: Range start index
     *         required: false
     *         schema:
     *           type: number
     *           default: 0
     *       - name: end
     *         in: query
     *         description: Range end index
     *         required: false
     *         schema:
     *           type: number
     *           default: 50
     *       - name: isChecked
     *         in: query
     *         description: Record acception status
     *         required: false
     *         schema:
     *           type: boolean
     *           default: true
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(async (req, res) => {
        try {
            res.send(await getLevelRecords(parseInt(req.params.id), req.query))
        } catch {
            res.status(404).send()
        }
    })

router.route('/:id/song')
    /**
     * @openapi
     * "/level/{id}/song":
     *   get:
     *     tags:
     *       - Level
     *     summary: Download level's NONG song if exist
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The id of the level
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           audio/mp3:
     *             schema:
     */
    .get(async (req, res) => {
        const { id } = req.params

        try {
            const level = new Level({ id: parseInt(id) })
            await level.pull()
    
            res.redirect(level.getSongPublicURL())
        } catch {
            res.status(404).send()
        }
    })

    /**
     * @openapi
     * "/level/{id}/song":
     *   delete:
     *     tags:
     *       - Level
     *     summary: Delete a level's song
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The id of the level
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .delete(adminAuth, async (req, res) => {
        const { id } = req.params

        try {
            const level = new Level({ id: parseInt(id) })

            await level.pull()
            await level.deleteSong()
    
            res.send()
        } catch {
            res.status(500).send()
        }
    })

export default router