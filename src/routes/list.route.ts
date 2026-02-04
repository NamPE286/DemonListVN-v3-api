import express from "express";
import { getDemonListLevels, getFeaturedListLevels, getPlatformerListLevels, getChallengeListLevels } from '@src/services/level.service'
import { getDemonListRecords, getFeaturedListRecords, getChallengeListRecords } from "@src/services/record.service";
import supabase from "@src/client/supabase";

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
     *       - name: topStart
     *         in: query
     *         description: Minimum dlTop position to filter
     *         required: false
     *         schema:
     *           type: number
     *       - name: topEnd
     *         in: query
     *         description: Maximum dlTop position to filter
     *         required: false
     *         schema:
     *           type: number
     *       - name: ratingMin
     *         in: query
     *         description: Minimum rating to filter
     *         required: false
     *         schema:
     *           type: number
     *       - name: ratingMax
     *         in: query
     *         description: Maximum rating to filter
     *         required: false
     *         schema:
     *           type: number
     *       - name: nameSearch
     *         in: query
     *         description: Search levels by name (case insensitive)
     *         required: false
     *         schema:
     *           type: string
     *       - name: creatorSearch
     *         in: query
     *         description: Search levels by creator name (case insensitive)
     *         required: false
     *         schema:
     *           type: string
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
     *       - name: topStart
     *         in: query
     *         description: Minimum dlTop position to filter
     *         required: false
     *         schema:
     *           type: number
     *       - name: topEnd
     *         in: query
     *         description: Maximum dlTop position to filter
     *         required: false
     *         schema:
     *           type: number
     *       - name: ratingMin
     *         in: query
     *         description: Minimum rating to filter
     *         required: false
     *         schema:
     *           type: number
     *       - name: ratingMax
     *         in: query
     *         description: Maximum rating to filter
     *         required: false
     *         schema:
     *           type: number
     *       - name: nameSearch
     *         in: query
     *         description: Search levels by name (case insensitive)
     *         required: false
     *         schema:
     *           type: string
     *       - name: creatorSearch
     *         in: query
     *         description: Search levels by creator name (case insensitive)
     *         required: false
     *         schema:
     *           type: string
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
     *       - name: topStart
     *         in: query
     *         description: Minimum flTop position to filter
     *         required: false
     *         schema:
     *           type: number
     *       - name: topEnd
     *         in: query
     *         description: Maximum flTop position to filter
     *         required: false
     *         schema:
     *           type: number
     *       - name: ratingMin
     *         in: query
     *         description: Minimum rating to filter
     *         required: false
     *         schema:
     *           type: number
     *       - name: ratingMax
     *         in: query
     *         description: Maximum rating to filter
     *         required: false
     *         schema:
     *           type: number
     *       - name: nameSearch
     *         in: query
     *         description: Search levels by name (case insensitive)
     *         required: false
     *         schema:
     *           type: string
     *       - name: creatorSearch
     *         in: query
     *         description: Search levels by creator name (case insensitive)
     *         required: false
     *         schema:
     *           type: string
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

router.route('/cl')
    /**
     * @openapi
     * "/list/cl":
     *   get:
     *     tags:
     *       - List
     *     summary: Get all levels of the Challenge List
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
     *       - name: topStart
     *         in: query
     *         description: Minimum dlTop position to filter
     *         required: false
     *         schema:
     *           type: number
     *       - name: topEnd
     *         in: query
     *         description: Maximum dlTop position to filter
     *         required: false
     *         schema:
     *           type: number
     *       - name: ratingMin
     *         in: query
     *         description: Minimum rating to filter
     *         required: false
     *         schema:
     *           type: number
     *       - name: ratingMax
     *         in: query
     *         description: Maximum rating to filter
     *         required: false
     *         schema:
     *           type: number
     *       - name: nameSearch
     *         in: query
     *         description: Search levels by name (case insensitive)
     *         required: false
     *         schema:
     *           type: string
     *       - name: creatorSearch
     *         in: query
     *         description: Search levels by creator name (case insensitive)
     *         required: false
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .get(async (req, res) => {
        try {
            res.send(await getChallengeListLevels(req.query))
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

router.route('/cl/records')
    /**
     * @openapi
     * "/list/cl/records":
     *   get:
     *     tags:
     *       - List
     *     summary: Get all records of the Challenge List
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
            res.send(await getChallengeListRecords(req.query))
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

async function getIDBound(list: string, min: boolean) {
    let query = supabase
        .from('levels')
        .select('id')
        .order('id', { ascending: min })
        .not(list == 'fl' ? 'flTop' : 'dlTop', 'is', null)
        .limit(1)

    if (list == 'cl') {
        query = query.eq('isChallenge', true)
    } else if (list == 'pl') {
        query = query.eq('isPlatformer', true).eq('isChallenge', false)
    } else if (list == 'dl') {
        query = query.eq('isPlatformer', false).eq('isChallenge', false)
    }

    const { data, error } = await query.single()

    if (error) {
        throw new Error(error.message)
    }

    return data.id
}

/**
 * @openapi
 * "/list/{list}/random":
 *   get:
 *     tags:
 *       - List
 *     summary: Get a random level from a list
 *     parameters:
 *       - name: list
 *         in: path
 *         description: List type (dl, pl, fl, or cl)
 *         required: true
 *         schema:
 *           type: string
 *           enum: [dl, pl, fl, cl]
 *       - name: exclude
 *         in: query
 *         description: Level IDs to exclude
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success - Returns a random level object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.route('/:list/random')
    .get(async (req, res) => {
        const { list } = req.params
        const { exclude } = req.query
        const maxID = await getIDBound(String(list), false)
        const minID = await getIDBound(String(list), true) - 1000000
        const random = Math.floor(Math.random() * (maxID - minID + 1)) + minID

        let query = supabase
            .from('levels')
            .select('*')
            .not(list == 'fl' ? 'flTop' : 'dlTop', 'is', null)
            .not('id', 'in', exclude ? exclude : '()')
            .order('id', { ascending: true })
            .gte('id', random)
            .limit(1)

        if (list == 'cl') {
            query = query.eq('isChallenge', true)
        } else if (list == 'pl') {
            query = query.eq('isPlatformer', true).eq('isChallenge', false)
        } else if (list == 'dl') {
            query = query.eq('isPlatformer', false).eq('isChallenge', false)
        }

        var { data, error } = await query.single()

        res.send(data)
    })

export default router