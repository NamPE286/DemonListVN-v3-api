import express from "express";
import { getDemonListLevels, getFeaturedListLevels, getPlatformerListLevels } from '@src/services/level'
import { getDemonListRecords, getFeaturedListRecords } from "@src/services/record";
import supabase from "@src/database/supabase";

const router = express.Router()

router.use((req, res, next) => {
    res.set('Cache-Control', 'public, s-maxage=180, max-age=180')
    next()
})

router.route('/dl')
    /**
     * @openapi
     * "/list/dl":
     *   get:
     *     tags:
     *       - List
     *     summary: Get all records of the Demon List
     *     parameters:
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
     *       - name: sortBy
     *         in: query
     *         description: Property of level to sort by
     *         required: false
     *         schema:
     *           type: string
     *           default: dlTop
     *       - name: ascending
     *         in: query
     *         description: Sort ascending
     *         required: false
     *         schema:
     *           type: boolean
     *           default: false
     *       - name: uid
     *         in: query
     *         description: Progress of player
     *         required: false
     *         schema:
     *           type: string
     *           default: false
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(async (req, res) => {
        try {
            res.send(await getDemonListLevels(req.query))
        } catch (err) {
            res.status(500).send()
        }
    })

router.route('/pl')
    /**
     * @openapi
     * "/list/pl":
     *   get:
     *     tags:
     *       - List
     *     summary: Get all records of the Platformer List
     *     parameters:
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
     *       - name: sortBy
     *         in: query
     *         description: Property of level to sort by
     *         required: false
     *         schema:
     *           type: string
     *           default: dlTop
     *       - name: ascending
     *         in: query
     *         description: Sort ascending
     *         required: false
     *         schema:
     *           type: boolean
     *           default: false
     *       - name: uid
     *         in: query
     *         description: Progress of player
     *         required: false
     *         schema:
     *           type: string
     *           default: false
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(async (req, res) => {
        try {
            res.send(await getPlatformerListLevels(req.query))
        } catch (err) {
            res.status(500).send()
        }
    })

router.route('/fl')
    /**
     * @openapi
     * "/list/fl":
     *   get:
     *     tags:
     *       - List
     *     summary: Get all records of the Demon List
     *     parameters:
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
     *       - name: sortBy
     *         in: query
     *         description: Property of level to sort by
     *         required: false
     *         schema:
     *           type: string
     *           default: flTop
     *       - name: ascending
     *         in: query
     *         description: Sort ascending
     *         required: false
     *         schema:
     *           type: boolean
     *           default: false
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(async (req, res) => {
        try {
            res.send(await getFeaturedListLevels(req.query))
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

router.route('/dl/records')
    /**
     * @openapi
     * "/list/dl/records":
     *   get:
     *     tags:
     *       - List
     *     summary: Get all records of the Demon List
     *     parameters:
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
            res.send(await getDemonListRecords(req.query))
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

router.route('/fl/records')
    /**
     * @openapi
     * "/list/fl/records":
     *   get:
     *     tags:
     *       - List
     *     summary: Get all records of the Featured List
     *     parameters:
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
            res.send(await getFeaturedListRecords(req.query))
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

async function getIDBound(list: string, min: boolean) {
    const { data, error } = await supabase
        .from('levels')
        .select('id')
        .order('id', { ascending: min })
        .not(list == 'fl' ? 'flTop' : 'dlTop', 'is', null)
        .eq('isPlatformer', list == 'pl')
        .limit(1)
        .single()

    if (error) {
        throw error
    }

    return data.id
}

router.route('/:list/random')
    .get(async (req, res) => {
        const { list } = req.params
        const { exclude } = req.query
        const maxID = await getIDBound(String(list), false)
        const minID = await getIDBound(String(list), true) - 1000000
        const random = Math.floor(Math.random() * (maxID - minID + 1)) + minID

        var { data, error } = await supabase
            .from('levels')
            .select('*')
            .not(list == 'fl' ? 'flTop' : 'dlTop', 'is', null)
            .eq('isPlatformer', list == 'pl')
            .not('id', 'in', exclude ? exclude : '()')
            .order('id', { ascending: true })
            .gte('id', random)
            .limit(1)
            .single()

        res.send(data)
    })

export default router