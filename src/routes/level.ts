import express from 'express'
import Level from '@src/classes/Level'
import adminAuth from '@src/middleware/adminAuth'

const router = express.Router()

router.route('/')
    /**
     * @openapi
     * '/level':
     *  put:
     *     tags:
     *     - Level
     *     summary: Add or update a level
     *     requestBody:
     *      required: true
     *      content:
     *        application/json:
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
     * '/level/{id}':
     *  get:
     *     tags:
     *     - Level
     *     summary: Get a single level by level's ID
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: Numeric ID of the level to get
     */
    .get(async (req, res) => {
        const { id } = req.params
        const level = new Level({ id: parseInt(id) })

        await level.init()

        res.send(level.data)
    })

export default router