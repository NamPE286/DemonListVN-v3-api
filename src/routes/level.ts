import express from 'express'
import Level from '@lib/classes/Level'
import adminAuth from '@src/middleware/adminAuth'
import { getLevelRecords } from '@lib/client'

const router = express.Router()

router.route('/')
    /**
      * @openapi
      * "/level":
      *   put:
      *     tags:
      *       - Level
      *     summary: Add or update a level
      *     requestBody:
      *     required: true
      *     content:
      *       application/json:
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

        const level = new Level(data)
        await level.update()

        res.send()
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
        const level = new Level({ id: parseInt(id) })

        await level.pull()

        res.send(level.data)
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
     *         content:
     *           application/json:
     *             schema:
     */
    .delete(adminAuth, async (req, res) => {
        const { id } = req.params
        const level = new Level({ id: parseInt(id) })

        await level.delete()

        res.send()
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
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(async (req, res) => {        
        res.send(await getLevelRecords(parseInt(req.params.id), req.query))
    })

export default router