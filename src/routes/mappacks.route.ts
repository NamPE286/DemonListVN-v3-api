import express from 'express'
import adminAuth from '@src/middleware/admin-auth.middleware'
import {
    getAllMapPacks,
    getMapPackById,
    createMapPackGeneral,
    updateMapPackGeneral,
    deleteMapPackGeneral,
    addMapPackLevelGeneral,
    deleteMapPackLevelGeneral
} from '@src/services/battlepass.service'

const router = express.Router()

/**
 * @openapi
 * "/mappacks":
 *   get:
 *     tags:
 *       - Map Packs
 *     summary: Get all map packs
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               difficulty:
 *                 type: string
 *               xp:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Map pack created successfully
 *       500:
 *         description: Internal server error
 */
router.route('/')
    .get(async (req, res) => {
        try {
            const mapPacks = await getAllMapPacks()
            res.send(mapPacks)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })
    .post(adminAuth, async (req, res) => {
        try {
            const mapPack = await createMapPackGeneral(req.body)
            res.send(mapPack)
        } catch (err: any) {
            console.error(err)
            res.status(500).send({ message: err.message })
        }
    })

/**
 * @openapi
 * "/mappacks/{mapPackId}":
 *   get:
 *     tags:
 *       - Map Packs
 *     summary: Get a specific map pack
 *     parameters:
 *       - name: mapPackId
 *         in: path
 *         description: Map Pack ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 *   patch:
 *     tags:
 *       - Map Packs
 *     summary: Update a map pack (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: mapPackId
 *         in: path
 *         description: Map Pack ID
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
 *   delete:
 *     tags:
 *       - Map Packs
 *     summary: Delete a map pack (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: mapPackId
 *         in: path
 *         description: Map Pack ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Map pack deleted successfully
 *       500:
 *         description: Internal server error
 */
router.route('/:mapPackId')
    .get(async (req, res) => {
        const { mapPackId } = req.params
        try {
            const mapPack = await getMapPackById(Number(mapPackId))
            res.send(mapPack)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })
    .patch(adminAuth, async (req, res) => {
        const { mapPackId } = req.params
        try {
            await updateMapPackGeneral(Number(mapPackId), req.body)
            res.send()
        } catch (err: any) {
            console.error(err)
            res.status(500).send({ message: err.message })
        }
    })
    .delete(adminAuth, async (req, res) => {
        const { mapPackId } = req.params
        try {
            await deleteMapPackGeneral(Number(mapPackId))
            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

/**
 * @openapi
 * "/mappacks/{mapPackId}/level":
 *   post:
 *     tags:
 *       - Map Packs
 *     summary: Add a level to a map pack (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: mapPackId
 *         in: path
 *         description: Map Pack ID
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
 *               levelID:
 *                 type: integer
 *               order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Level added successfully
 *       500:
 *         description: Internal server error
 */
router.route('/:mapPackId/level')
    .post(adminAuth, async (req, res) => {
        const { mapPackId } = req.params
        try {
            const level = await addMapPackLevelGeneral({
                mapPackId: Number(mapPackId),
                ...req.body
            })
            res.send(level)
        } catch (err: any) {
            console.error(err)
            res.status(500).send({ message: err.message })
        }
    })

/**
 * @openapi
 * "/mappacks/{mapPackId}/level/{levelId}":
 *   delete:
 *     tags:
 *       - Map Packs
 *     summary: Remove a level from a map pack (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: mapPackId
 *         in: path
 *         description: Map Pack ID
 *         required: true
 *         schema:
 *           type: integer
 *       - name: levelId
 *         in: path
 *         description: Level ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Level removed successfully
 *       500:
 *         description: Internal server error
 */
router.route('/:mapPackId/level/:levelId')
    .delete(adminAuth, async (req, res) => {
        const { levelId } = req.params
        try {
            await deleteMapPackLevelGeneral(Number(levelId))
            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

export default router
