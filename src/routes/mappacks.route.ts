import express from 'express'
import supabase from '@src/client/supabase'
import adminAuth from '@src/middleware/admin-auth.middleware'
import { getActiveBattlePassMapPacks } from '@src/services/battlepass.service'

const router = express.Router()

/**
 * @openapi
 * "/mappacks":
 *   get:
 *     tags:
 *       - Map Packs
 *     summary: Get all map packs
 *     parameters:
 *       - name: from
 *         in: query
 *         description: Range start index
 *         required: false
 *         schema:
 *           type: integer
 *           default: 0
 *       - name: to
 *         in: query
 *         description: Range end index
 *         required: false
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Internal server error
 */
router.route('/')
    .get(async (req, res) => {
        try {
            const from = parseInt(req.query.from as string) || 0
            const to = parseInt(req.query.to as string) || 50

            const { data, error } = await (supabase as any)
                .from('mapPacks')
                .select('*')
                .range(from, to)

            if (error) {
                console.error(error)
                res.status(500).send()
                return
            }

            res.send(data)
        } catch {
            res.status(500).send()
        }
    })
    /**
     * @openapi
     * "/mappacks":
     *   post:
     *     tags:
     *       - Map Packs
     *     summary: Create a new map pack (Admin only)
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *     responses:
     *       200:
     *         description: Map pack created successfully
     *       500:
     *         description: Internal server error
     */
    .post(adminAuth, async (req, res) => {
        try {
            const { error } = await (supabase as any)
                .from('mapPacks')
                .insert(req.body)

            if (error) {
                console.error(error)
                res.status(500).send()
                return
            }

            res.send()
        } catch {
            res.status(500).send()
        }
    })

/**
 * @openapi
 * "/mappacks/battlepass":
 *   get:
 *     tags:
 *       - Map Packs
 *     summary: Get map packs in the active battle pass season
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Internal server error
 */
router.route('/battlepass')
    .get(async (req, res) => {
        try {
            const data = await getActiveBattlePassMapPacks()
            res.send(data)
        } catch {
            res.status(500).send()
        }
    })

/**
 * @openapi
 * "/mappacks/{id}":
 *   get:
 *     tags:
 *       - Map Packs
 *     summary: Get a map pack by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The ID of the map pack
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *       404:
 *         description: Map pack not found
 *       500:
 *         description: Internal server error
 */
router.route('/:id')
    .get(async (req, res) => {
        try {
            const { id } = req.params

            const { data, error } = await (supabase as any)
                .from('mapPacks')
                .select('*')
                .eq('id', parseInt(id))
                .single()

            if (error) {
                if (error.code === 'PGRST116') {
                    res.status(404).send()
                    return
                }
                console.error(error)
                res.status(500).send()
                return
            }

            res.send(data)
        } catch {
            res.status(500).send()
        }
    })
    /**
     * @openapi
     * "/mappacks/{id}":
     *   put:
     *     tags:
     *       - Map Packs
     *     summary: Update a map pack (Admin only)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The ID of the map pack
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
     *         description: Map pack updated successfully
     *       500:
     *         description: Internal server error
     */
    .put(adminAuth, async (req, res) => {
        try {
            const { id } = req.params

            const { error } = await (supabase as any)
                .from('mapPacks')
                .update(req.body)
                .eq('id', parseInt(id))

            if (error) {
                console.error(error)
                res.status(500).send()
                return
            }

            res.send()
        } catch {
            res.status(500).send()
        }
    })
    /**
     * @openapi
     * "/mappacks/{id}":
     *   delete:
     *     tags:
     *       - Map Packs
     *     summary: Delete a map pack (Admin only)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The ID of the map pack
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Map pack deleted successfully
     *       500:
     *         description: Internal server error
     */
    .delete(adminAuth, async (req, res) => {
        try {
            const { id } = req.params

            const { error } = await (supabase as any)
                .from('mapPacks')
                .delete()
                .eq('id', parseInt(id))

            if (error) {
                console.error(error)
                res.status(500).send()
                return
            }

            res.send()
        } catch {
            res.status(500).send()
        }
    })

/**
 * @openapi
 * "/mappacks/{id}/levels":
 *   get:
 *     tags:
 *       - Map Packs
 *     summary: Get levels in a map pack
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The ID of the map pack
 *         required: true
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
router.route('/:id/levels')
    .get(async (req, res) => {
        try {
            const { id } = req.params

            const { data, error } = await (supabase as any)
                .from('mapPackLevels')
                .select('*, levels(*)')
                .eq('packID', parseInt(id))

            if (error) {
                console.error(error)
                res.status(500).send()
                return
            }

            res.send(data)
        } catch {
            res.status(500).send()
        }
    })

export default router
