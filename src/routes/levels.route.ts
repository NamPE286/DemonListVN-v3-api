import express from 'express'
import type { NextFunction, Response, Request } from 'express'
import adminAuth from '@src/middleware/admin-auth.middleware'
import { getLevelDeathCount } from '@src/services/death-count.service'
import { getLevelRecords } from '@src/services/record.service'
import { updateLevel, getLevel, fetchLevelFromGD, deleteLevel, refreshLevel, getLevelTags, createLevelTag, deleteLevelTag, updateLevelTag, setLevelTags, getLevelTagsForLevel, addLevelVariant, removeLevelVariant, getLevelVariants, retrieveOrCreateLevel } from '@src/services/level.service'
import userAuth from '@src/middleware/user-auth.middleware'
import supabase from '@src/client/supabase'
import { getEventLevelsSafe } from '@src/services/event.service'
import webhookAuth from '@src/middleware/webhook-auth.middleware'

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

// Get all level tags
router.route('/tags')
    .get(async (_req, res) => {
        try {
            const tags = await getLevelTags()
            res.json(tags)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

// Admin: create a level tag
router.route('/tags')
    .post(adminAuth, async (req, res) => {
        try {
            const tag = await createLevelTag(req.body)
            res.status(201).json(tag)
        } catch (err: any) {
            if (err.message === 'Tag already exists') {
                res.status(409).json({ error: err.message })
            } else {
                console.error(err)
                res.status(500).send()
            }
        }
    })

// Admin: delete a level tag (removes from all levels)
router.route('/tags/:tagId')
    .delete(adminAuth, async (req, res) => {
        try {
            await deleteLevelTag(parseInt(req.params.tagId))
            res.json({ success: true })
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

// Admin: update a level tag (name and/or color)
router.route('/tags/:tagId')
    .put(adminAuth, async (req, res) => {
        try {
            const tag = await updateLevelTag(parseInt(req.params.tagId), req.body)
            res.json(tag)
        } catch (err: any) {
            if (err.message === 'Tag already exists') {
                res.status(409).json({ error: err.message })
            } else {
                console.error(err)
                res.status(500).send()
            }
        }
    })

router.route('/refresh')
    .post(webhookAuth, async (req, res) => {
        try {
            await refreshLevel()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }

        res.send()
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
            await updateLevel(data)

            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

/**
 * @openapi
 * /levels/new:
 *   get:
 *     summary: Retrieve new levels with null ratings, flTop, and insaneTier.
 *     tags:
 *       - Levels
 *     responses:
 *       200:
 *         description: Successfully retrieved levels.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       500:
 *         description: Internal server error.
 */
router.route("/new")
    .get(async (req, res) => {
        const { data, error } = await supabase
            .from("levels")
            .select("*")
            .is("rating", null)
            .is("flTop", null)
            .is("insaneTier", null)
            .is("isNonList", false);

        if (error) {
            res.status(500).send();

            return;
        }

        res.send(data);
    });

/**
 * @openapi
 * "/levels/random":
 *   get:
 *     tags:
 *       - Level
 *     summary: Get random levels
 *     parameters:
 *       - name: list
 *         in: query
 *         description: Filter by list type (dl, fl, pl)
 *         required: false
 *         schema:
 *           type: string
 *           enum: [dl, fl, pl]
 *       - name: limit
 *         in: query
 *         description: Number of levels to return
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Internal server error
 */
router.route("/random")
    .get(async (req, res) => {
        const { list, limit } = req.query;
        const { data, error } = await supabase.rpc("get_random_levels", {
            row_count: Number(limit),
            // @ts-ignore
            filter_type: list ? String(list) : null,
        });

        if (error) {
            console.error(error);
            res.status(500).send();

            return;
        }

        res.send(data)
    });


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
            if (!fromGD) {
                const level = await getLevel(parseInt(id))
                res.send(level)
            } else {
                res.send(await fetchLevelFromGD(parseInt(id)))
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
            await deleteLevel(parseInt(id))

            res.send()
        } catch (err) {
            console.error(err)
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

/**
 * @openapi
 * "/levels/{id}/inEvent":
 *   get:
 *     tags:
 *       - Level
 *     summary: Check if level is in any active events for user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The ID of the level
 *         required: true
 *         schema:
 *           type: integer
 *       - name: type
 *         in: query
 *         description: Event type filter
 *         required: false
 *         schema:
 *           type: string
 *           default: basic
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Internal server error
 */
router.route('/:id/inEvent')
    .get(userAuth, async (req, res) => {
        let { type } = req.query
        const { user } = res.locals
        const { id } = req.params
        const now = new Date().toISOString()

        if (!type) {
            type = 'contest'
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

// ---- Level Tags ----

// Get tags for a level
router.route('/:id/tags')
    .get(checkID, async (req, res) => {
        try {
            const tags = await getLevelTagsForLevel(parseInt(req.params.id))
            res.json(tags)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

// Admin: set tags on a level
router.route('/:id/tags')
    .put([adminAuth, checkID], async (req: any, res: any) => {
        try {
            const { tag_ids } = req.body
            if (!Array.isArray(tag_ids)) {
                res.status(400).json({ error: 'tag_ids must be an array' })
                return
            }
            const tags = await setLevelTags(parseInt(req.params.id), tag_ids)
            res.json(tags)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

// ---- Level Variants ----

// Get variants for a level
router.route('/:id/variants')
    .get(checkID, async (req, res) => {
        try {
            const variants = await getLevelVariants(parseInt(req.params.id))
            res.json(variants)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

// Admin: add a variant to a level
router.route('/:id/variants')
    .post([adminAuth, checkID], async (req: any, res: any) => {
        const mainLevelId = parseInt(req.params.id)
        const { variantLevelId } = req.body

        if (!variantLevelId) {
            res.status(400).json({ error: 'variantLevelId is required' })
            return
        }

        try {
            // Fetch variant level from GD if not in DB
            try {
                await getLevel(variantLevelId)
            } catch {
                const gdLevel = await fetchLevelFromGD(variantLevelId)
                await retrieveOrCreateLevel({
                    id: gdLevel.id,
                    name: gdLevel.name,
                    creator: gdLevel.author,
                    difficulty: gdLevel.difficulty,
                    isPlatformer: gdLevel.length === 5,
                    isNonList: true
                } as any)
            }

            const variant = await addLevelVariant(mainLevelId, variantLevelId)
            res.status(201).json(variant)
        } catch (err: any) {
            console.error(err)
            res.status(500).json({ error: err.message })
        }
    })

// Admin: remove a variant from a level
router.route('/:id/variants/:variantId')
    .delete([adminAuth, checkID], async (req: any, res: any) => {
        try {
            await removeLevelVariant(parseInt(req.params.variantId))
            res.json({ success: true })
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

export default router