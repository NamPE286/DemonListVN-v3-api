import express from 'express'
import adminAuth from '@src/middleware/admin-auth.middleware'
import optionalAuth from '@src/middleware/optional-user-auth.middleware'
import userAuth from '@src/middleware/user-auth.middleware'
import {
    addLevelToCustomList,
    browseLists,
    ConflictError,
    createCustomList,
    deleteCustomList,
    ForbiddenError,
    getCustomList,
    getCustomListLeaderboard,
    getCustomListRecordPoints,
    getOwnCustomLists,
    getRandomCustomListLevel,
    refreshCustomListLeaderboard,
    getStarredCustomLists,
    getStarredListsByLevel,
    NotFoundError,
    previewCustomListWeightFormula,
    removeLevelFromCustomList,
    reorderListLevels,
    resolveCustomListIdentifier,
    toggleCustomListStar,
    updateCustomList,
    updateCustomListOfficialMetadata,
    updateListLevel,
    ValidationError,
} from '@src/services/custom-list.service'

const router = express.Router()

function sendError(res: express.Response, error: unknown) {
    if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message })
        return true
    }

    if (error instanceof ForbiddenError) {
        res.status(403).json({ error: error.message })
        return true
    }

    if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message })
        return true
    }

    if (error instanceof ConflictError) {
        res.status(409).json({ error: error.message })
        return true
    }

    return false
}

function parseId(value: string, label: string, options?: { allowZero?: boolean }) {
    const parsed = Number.parseInt(value, 10)
    const minimum = options?.allowZero ? 0 : 1

    if (!Number.isInteger(parsed) || parsed < minimum) {
        throw new ValidationError(`Invalid ${label}`)
    }

    return parsed
}

function parseFiniteNumber(value: unknown, label: string) {
    const parsed = typeof value === 'number' ? value : Number(value)

    if (!Number.isFinite(parsed)) {
        throw new ValidationError(`Invalid ${label}`)
    }

    return parsed
}

router.route('/me')
    .get(userAuth, async (req, res) => {
        try {
            res.send(await getOwnCustomLists(res.locals.user.uid))
        } catch (error) {
            if (sendError(res, error)) {
                return
            }

            console.error(error)
            res.status(500).send()
        }
    })

router.route('/starred')
    .get(userAuth, async (req, res) => {
        try {
            res.send(await getStarredCustomLists(res.locals.user.uid))
        } catch (error) {
            if (sendError(res, error)) {
                return
            }

            console.error(error)
            res.status(500).send()
        }
    })

router.route('/')
    .get(optionalAuth, async (req, res) => {
        try {
            const limit = req.query.limit ? parseId(String(req.query.limit), 'limit') : 24
            const offset = req.query.offset ? parseId(String(req.query.offset), 'offset', { allowZero: true }) : 0
            const search = typeof req.query.search === 'string' ? req.query.search : ''
            const viewerId = res.locals.authenticated ? res.locals.user.uid : undefined

            res.send(await browseLists({ limit, offset, search, viewerId }))
        } catch (error) {
            if (sendError(res, error)) {
                return
            }

            console.error(error)
            res.status(500).send()
        }
    })
    .post(userAuth, async (req, res) => {
        try {
            const list = await createCustomList(res.locals.user.uid, req.body)
            res.status(201).send(list)
        } catch (error) {
            if (sendError(res, error)) {
                return
            }

            console.error(error)
            res.status(500).send()
        }
    })

router.route('/levels/:levelId/starred')
    .get(optionalAuth, async (req, res) => {
        try {
            const levelId = parseId(req.params.levelId, 'level ID')
            const viewerId = res.locals.authenticated ? res.locals.user.uid : undefined

            res.send(await getStarredListsByLevel(levelId, viewerId))
        } catch (error) {
            if (sendError(res, error)) {
                return
            }

            console.error(error)
            res.status(500).send()
        }
    })

router.route('/official/:id')
    .patch(adminAuth, async (req, res) => {
        try {
            const listId = parseId(req.params.id, 'list ID')
            res.send(await updateCustomListOfficialMetadata(listId, req.body))
        } catch (error) {
            if (sendError(res, error)) {
                return
            }

            console.error(error)
            res.status(500).send()
        }
    })

router.route('/formula/preview')
    .post(async (req, res) => {
        try {
            res.send(previewCustomListWeightFormula(req.body?.formula, {
                position: parseFiniteNumber(req.body?.position, 'position'),
                levelCount: parseFiniteNumber(req.body?.levelCount, 'levelCount'),
                top: parseFiniteNumber(req.body?.top ?? 1, 'top'),
                rating: parseFiniteNumber(req.body?.rating, 'rating'),
                time: parseFiniteNumber(req.body?.time ?? req.body?.progress, 'time'),
                baseTime: parseFiniteNumber(req.body?.baseTime ?? req.body?.minProgress, 'baseTime'),
                minProgress: parseFiniteNumber(req.body?.minProgress ?? req.body?.baseTime, 'minProgress'),
                progress: parseFiniteNumber(req.body?.progress ?? req.body?.time, 'progress')
            }))
        } catch (error) {
            if (sendError(res, error)) {
                return
            }

            console.error(error)
            res.status(500).send()
        }
    })

router.route('/:id/leaderboard')
    .get(optionalAuth, async (req, res) => {
        try {
            const start = req.query.start ? parseId(String(req.query.start), 'start', { allowZero: true }) : 0
            const end = req.query.end ? parseId(String(req.query.end), 'end', { allowZero: true }) : 49
            const viewerId = res.locals.authenticated ? res.locals.user.uid : undefined

            res.send(await getCustomListLeaderboard(req.params.id, { start, end, viewerId }))
        } catch (error) {
            if (sendError(res, error)) {
                return
            }

            console.error(error)
            res.status(500).send()
        }
    })

router.route('/:id/records')
    .get(optionalAuth, async (req, res) => {
        try {
            const start = req.query.start ? parseId(String(req.query.start), 'start', { allowZero: true }) : 0
            const end = req.query.end ? parseId(String(req.query.end), 'end', { allowZero: true }) : 49
            const viewerId = res.locals.authenticated ? res.locals.user.uid : undefined
            const uid = typeof req.query.uid === 'string' && req.query.uid.trim().length
                ? req.query.uid.trim()
                : undefined

            res.send(await getCustomListRecordPoints(req.params.id, { start, end, viewerId, uid }))
        } catch (error) {
            if (sendError(res, error)) {
                return
            }

            console.error(error)
            res.status(500).send()
        }
    })

router.route('/:id/leaderboard/refresh')
    .post(userAuth, async (req, res) => {
        try {
            res.send(await refreshCustomListLeaderboard(req.params.id, res.locals.user.uid))
        } catch (error) {
            if (sendError(res, error)) {
                return
            }

            console.error(error)
            res.status(500).send()
        }
    })

router.route('/:id/random')
    .get(optionalAuth, async (req, res) => {
        try {
            const viewerId = res.locals.authenticated ? res.locals.user.uid : undefined
            const excludeLevelIds = typeof req.query.exclude === 'string'
                ? req.query.exclude.split(',').map((value) => Number.parseInt(value, 10)).filter((value) => Number.isInteger(value) && value > 0)
                : []

            res.send(await getRandomCustomListLevel(req.params.id, { excludeLevelIds, viewerId }))
        } catch (error) {
            if (sendError(res, error)) {
                return
            }

            console.error(error)
            res.status(500).send()
        }
    })

router.route('/:id')
    .get(optionalAuth, async (req, res) => {
        try {
            const viewerId = res.locals.authenticated ? res.locals.user.uid : undefined
            const hasItemRange = req.query.start !== undefined || req.query.end !== undefined
            const itemsStart = hasItemRange
                ? (req.query.start ? parseId(String(req.query.start), 'start', { allowZero: true }) : 0)
                : undefined
            const itemsEnd = hasItemRange
                ? (req.query.end ? parseId(String(req.query.end), 'end', { allowZero: true }) : (itemsStart ?? 0) + 49)
                : undefined

            if (itemsStart !== undefined && itemsEnd !== undefined && itemsEnd < itemsStart) {
                throw new ValidationError('Invalid item range')
            }

            res.send(await getCustomList(req.params.id, viewerId, { itemsStart, itemsEnd }))
        } catch (error) {
            if (sendError(res, error)) {
                return
            }

            console.error(error)
            res.status(500).send()
        }
    })
    .patch(userAuth, async (req, res) => {
        try {
            const listId = parseId(req.params.id, 'list ID')
            res.send(await updateCustomList(listId, res.locals.user.uid, req.body))
        } catch (error) {
            if (sendError(res, error)) {
                return
            }

            console.error(error)
            res.status(500).send()
        }
    })
    .delete(userAuth, async (req, res) => {
        try {
            const listId = parseId(req.params.id, 'list ID')
            await deleteCustomList(listId, res.locals.user.uid)
            res.status(204).end()
        } catch (error) {
            if (sendError(res, error)) {
                return
            }

            console.error(error)
            res.status(500).send()
        }
    })

router.route('/:id/star')
    .post(userAuth, async (req, res) => {
        try {
            const listId = parseId(req.params.id, 'list ID')
            res.send(await toggleCustomListStar(listId, res.locals.user.uid))
        } catch (error) {
            if (sendError(res, error)) {
                return
            }

            console.error(error)
            res.status(500).send()
        }
    })

router.route('/:id/levels')
    .post(userAuth, async (req, res) => {
        try {
            const listId = parseId(req.params.id, 'list ID')
            const levelId = parseId(String(req.body.levelId), 'level ID')
            res.status(201).send(await addLevelToCustomList(listId, res.locals.user.uid, levelId))
        } catch (error) {
            if (sendError(res, error)) {
                return
            }

            console.error(error)
            res.status(500).send()
        }
    })

router.route('/:id/levels/:levelId')
    .patch(userAuth, async (req, res) => {
        try {
            const listId = parseId(req.params.id, 'list ID')
            const levelId = parseId(req.params.levelId, 'level ID')
            res.send(await updateListLevel(listId, res.locals.user.uid, levelId, req.body))
        } catch (error) {
            if (sendError(res, error)) {
                return
            }

            console.error(error)
            res.status(500).send()
        }
    })
    .delete(userAuth, async (req, res) => {
        try {
            const listId = parseId(req.params.id, 'list ID')
            const levelId = parseId(req.params.levelId, 'level ID')
            res.send(await removeLevelFromCustomList(listId, res.locals.user.uid, levelId))
        } catch (error) {
            if (sendError(res, error)) {
                return
            }

            console.error(error)
            res.status(500).send()
        }
    })

router.route('/:id/reorder')
    .patch(userAuth, async (req, res) => {
        try {
            const listId = parseId(req.params.id, 'list ID')
            res.send(await reorderListLevels(listId, res.locals.user.uid, req.body.levelIds))
        } catch (error) {
            if (sendError(res, error)) {
                return
            }

            console.error(error)
            res.status(500).send()
        }
    })

export default router