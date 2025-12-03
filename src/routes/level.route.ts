import express from 'express'
import type { NextFunction, Response, Request } from 'express'
import Level from '@src/classes/Level'
import adminAuth from '@src/middleware/adminAuth.middleware'
import { getLevelDeathCount } from '@src/services/deathCount.service'
import { getLevelRecords } from '@src/services/record.service'
import userAuth from '@src/middleware/userAuth.middleware'
import supabase from '@src/client/supabase'
import { getEventLevelsSafe } from '@src/services/event.service'

const router = express.Router()

function checkID(req: Request, res: Response, next: NextFunction) {
    if ('id' in req.params) {
        if (isNaN(parseInt(req.params.id))) {
            res.status(400).send({
                message: "Invalid ID (ID should only include numeric character)"
            })

            return
        }
    }

    next()
}

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
            res.status(500).send()
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
    .get(checkID, async (req, res) => {
        const { id } = req.params
        const { fromGD } = req.query

        try {
            const level = new Level({ id: parseInt(id) })

            if (!fromGD) {
                await level.pull()
                res.send(level)
            } else {
                res.send(await level.fetchFromGD())
            }

        } catch (err) {
            console.error(err)
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
    .delete([adminAuth, checkID], async (req: Request, res: Response) => {
        const { id } = req.params

        try {
            const level = new Level({ id: parseInt(id) })
            await level.delete()

            res.send()
        } catch (err) {
            res.status(500).send()
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
    .get(checkID, async (req, res) => {
        try {
            res.send(await getLevelRecords(parseInt(req.params.id), req.query))
        } catch {
            res.status(404).send()
        }
    })

router.route('/:id/deathCount')
    /**
     * @openapi
     * "/deathCount/{uid}/{levelID}":
     *   get:
     *     tags:
     *       - Level
     *     summary: Get level's death count
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
        try {
            const { id } = req.params;
            res.send(await getLevelDeathCount(parseInt(id)));
        } catch {
            res.status(500).send()
        }
    })

router.route('/:id/inEvent')
    .get(userAuth, async (req, res) => {
        let { type } = req.query
        const { user } = res.locals
        const { id } = req.params
        const now = new Date().toISOString()

        if (!type) {
            type = 'basic'
        }

        const { data, error } = await supabase
            .from('eventProofs')
            .select('userid, eventID, events!inner(start, end, type, eventLevels!inner(levelID))')
            .eq('userid', user.uid!)
            .eq('events.eventLevels.levelID', Number(id))
            .eq('events.type', String(type))
            .lte('events.start', now)
            .gte('events.end', now)

        if (error) {
            console.error(error)
            res.status(500).send();
            return;
        }

        for (const i of data) {
            const levels = await getEventLevelsSafe(i.eventID)

            if (levels.some(level => level && level.levelID === Number(id))) {
                res.send()
                return
            }
        }

        res.status(404).send();
    })

export default router