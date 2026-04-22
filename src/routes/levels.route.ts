import express from 'express'
import type { NextFunction, Response, Request } from 'express'
import adminAuth from '@src/middleware/admin-auth.middleware'
import { getLevelDeathCount } from '@src/services/death-count.service'
import { getLevelRecords } from '@src/services/record.service'
import { updateLevel, getLevel, fetchLevelFromGD, deleteLevel, refreshLevel, getLevelTags, createLevelTag, deleteLevelTag, updateLevelTag, setLevelTags, getLevelTagsForLevel, addLevelVariant, removeLevelVariant, getLevelVariants, retrieveOrCreateLevel, crawlLevel, crawlLevels } from '@src/services/level.service'
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

function parseForcedQuery(value: unknown) {
    if (typeof value !== 'string') {
        return false
    }

    const normalizedValue = value.trim().toLowerCase()
    return normalizedValue === '1' || normalizedValue === 'true' || normalizedValue === 'yes'
}

function parseBatchCrawlIds(value: unknown) {
    if (typeof value !== 'string') {
        return null
    }

    const rawEntries = value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)

    if (!rawEntries.length) {
        return null
    }

    const ids = rawEntries.map((entry) => Number.parseInt(entry, 10))

    if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
        return null
    }

    if (!ids.length) {
        return null
    }

    return [...new Set(ids)]
}

// Get all level tags
/**
 * @openapi
 * "/levels/tags":
 *   get:
 *     tags:
 *       - Level
 *     summary: Get all level tags
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Internal server error
 */
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
/**
 * @openapi
 * "/levels/tags":
 *   post:
 *     tags:
 *       - Level
 *     summary: Create a level tag (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Tag created successfully
 *       409:
 *         description: Tag already exists
 *       500:
 *         description: Internal server error
 */
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
/**
 * @openapi
 * "/levels/tags/{tagId}":
 *   delete:
 *     tags:
 *       - Level
 *     summary: Delete a level tag (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tagId
 *         in: path
 *         description: The ID of the tag to delete
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tag deleted successfully
 *       500:
 *         description: Internal server error
 */
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
/**
 * @openapi
 * "/levels/tags/{tagId}":
 *   put:
 *     tags:
 *       - Level
 *     summary: Update a level tag (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tagId
 *         in: path
 *         description: The ID of the tag to update
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Tag updated successfully
 *       409:
 *         description: Tag already exists
 *       500:
 *         description: Internal server error
 */
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

/**
 * @openapi
 * "/levels/refresh":
 *   post:
 *     tags:
 *       - Level
 *     summary: Refresh level (webhook only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Level refreshed successfully
 *       500:
 *         description: Internal server error
 */
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

router.route('/crawl')
    .post(userAuth, async (req: Request, res: Response) => {
        const levelIds = parseBatchCrawlIds(req.query.ids)

        if (!levelIds) {
            res.status(400).json({ error: 'Query parameter ids must be a comma-separated list of positive integers' })
            return
        }

        const forced = parseForcedQuery(req.query.forced)

        if (forced && !res.locals.user?.isAdmin) {
            res.status(403).json({ error: 'Forced crawl is only available for admins' })
            return
        }

        try {
            const results = await crawlLevels(levelIds, { forced })
            res.send({
                forced,
                results,
                crawled: results.filter((result) => result.status === 'crawled').length,
                skipped: results.filter((result) => result.status === 'skipped').length,
                notFound: results.filter((result) => result.status === 'not_found').length
            })
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
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

/**
 * @openapi
 * "/levels/batch":
 *   post:
 *     tags:
 *       - Level
 *     summary: Get multiple levels by IDs
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               batch:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Array of level IDs
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 */
router.route('/batch')
    .post(async (req, res) => {
        const { batch } = req.body ?? {}

        if (!Array.isArray(batch) || batch.length === 0) {
            res.send([])
            return
        }

        const ids = [...new Set(batch.map((id: any) => Number(id)).filter((id: number) => Number.isFinite(id)))]

        if (ids.length === 0) {
            res.send([])
            return
        }

        try {
            const { data, error } = await supabase
                .from('levels')
                .select('*')
                .in('id', ids)

            if (error) {
                console.error(error)
                res.status(500).send()
                return
            }

            res.send(data || [])
        } catch (err) {
            console.error(err)
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

router.route('/:id/crawl')
    .post([userAuth, checkID], async (req: Request, res: Response) => {
        const levelId = parseInt(req.params.id)
        const forced = parseForcedQuery(req.query.forced)

        if (forced && !res.locals.user?.isAdmin) {
            res.status(403).json({ error: 'Forced crawl is only available for admins' })
            return
        }

        try {
            const result = await crawlLevel(levelId, { forced })
            res.send({
                ...result.level,
                crawlStatus: result.status,
                forced
            })
        } catch (err) {
            console.error(err)
            res.status(404).json({ error: 'Level not found on the official Geometry Dash server' })
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
/**
 * @openapi
 * "/levels/{id}/tags":
 *   get:
 *     tags:
 *       - Level
 *     summary: Get tags for a level
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The ID of the level
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       500:
 *         description: Internal server error
 */
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
/**
 * @openapi
 * "/levels/{id}/tags":
 *   put:
 *     tags:
 *       - Level
 *     summary: Set tags on a level (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The ID of the level
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tag_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Tags set successfully
 *       400:
 *         description: Invalid tag_ids format
 *       500:
 *         description: Internal server error
 */
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
/**
 * @openapi
 * "/levels/{id}/variants":
 *   get:
 *     tags:
 *       - Level
 *     summary: Get variants for a level
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The ID of the level
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       500:
 *         description: Internal server error
 */
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
/**
 * @openapi
 * "/levels/{id}/variants":
 *   post:
 *     tags:
 *       - Level
 *     summary: Add a variant to a level (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The ID of the main level
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - variantLevelId
 *             properties:
 *               variantLevelId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Variant added successfully
 *       400:
 *         description: Missing variantLevelId
 *       500:
 *         description: Internal server error
 */
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
/**
 * @openapi
 * "/levels/{id}/variants/{variantId}":
 *   delete:
 *     tags:
 *       - Level
 *     summary: Remove a variant from a level (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The ID of the main level
 *         required: true
 *         schema:
 *           type: integer
 *       - name: variantId
 *         in: path
 *         description: The ID of the variant to remove
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Variant removed successfully
 *       500:
 *         description: Internal server error
 */
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