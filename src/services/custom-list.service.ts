import supabase from '@src/client/supabase'
import {
    all,
    create,
} from 'mathjs'
import {
    fetchLevelFromGD,
    getChallengeListLevels,
    getDemonListLevels,
    getFeaturedListLevels,
    getLevel,
    getPlatformerListLevels,
    retrieveOrCreateLevel
} from '@src/services/level.service'
import type { Tables, TablesInsert, TablesUpdate } from '@src/types/supabase'

type CustomList = Tables<'lists'>
type CustomListInsert = TablesInsert<'lists'>
type CustomListUpdate = TablesUpdate<'lists'>
type CustomListLevelInsert = TablesInsert<'listLevels'>
type CustomListStarInsert = TablesInsert<'listStars'>
type CustomListLeaderboardRefreshRow = {
    id: number
    listId: number
    totalPlayers: number
    totalRecords: number
    lastRefreshedAt: string
}

type CustomListLeaderboardEntry = {
    uid: string
    rank: number
    score: number
    completedCount: number
}

type CustomListLeaderboardRecordEntry = {
    uid: string
    levelId: number
    point: number
    no: number
}

type CustomListActor = string | {
    uid: string
    isAdmin?: boolean | null
    isManager?: boolean | null
} | undefined

const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

type CustomListWithOwnerData = CustomList & {
    ownerData?: any
}

const VISIBILITY_VALUES = new Set(['private', 'unlisted', 'public'])
const MODE_VALUES = new Set(['rating', 'top'])
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const WEIGHT_FORMULA_VALIDATION_SCOPE = {
    position: 1,
    levelCount: 1,
    top: 1,
    rating: 1,
    time: 0,
    baseTime: 0,
    minProgress: 0,
    progress: 0
}
const OFFICIAL_LIST_SLUGS = ['dl', 'pl', 'fl', 'cl'] as const
const CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE = 1000
const CUSTOM_LIST_LEADERBOARD_PLAYER_BATCH_SIZE = 500

export type CustomListIdentifier = number | string

type OfficialListSlug = (typeof OFFICIAL_LIST_SLUGS)[number]

function getOfficialListConfig(slug: OfficialListSlug) {
    switch (slug) {
        case 'dl':
            return {
                slug: 'dl',
                title: 'Classic List',
                description: 'Official Geometry Dash Việt Nam classic demon list.',
                mode: 'rating' as const,
                isPlatformer: false,
                weightFormula: 'rating*(max(0,1-abs(position-1))/3+max(0,1-abs(position-2))/5+2*max(0,1-abs(position-3))/15)+10*min(1,max(0,position-3))*min(1,max(0,26-position))/3+2*min(1,max(0,position-25))/3',
                loadLevels: getDemonListLevels
            }
        case 'pl':
            return {
                slug: 'pl',
                title: 'Platformer List',
                description: 'Official Geometry Dash Việt Nam platformer list.',
                mode: 'top' as const,
                isPlatformer: true,
                weightFormula: '1',
                loadLevels: getPlatformerListLevels
            }
        case 'fl':
            return {
                slug: 'fl',
                title: 'Featured List',
                description: 'Official Geometry Dash Việt Nam featured list.',
                mode: 'top' as const,
                isPlatformer: false,
                weightFormula: '1',
                loadLevels: getFeaturedListLevels
            }
        case 'cl':
            return {
                slug: 'cl',
                title: 'Challenge List',
                description: 'Official Geometry Dash Việt Nam challenge list.',
                mode: 'rating' as const,
                isPlatformer: false,
                weightFormula: 'rating*(max(0,ceil(-pow((position-42.21)/10,3)+30)/100)/12)',
                loadLevels: getChallengeListLevels
            }
    }
}

function isOfficialListSlug(value: string): value is OfficialListSlug {
    return (OFFICIAL_LIST_SLUGS as readonly string[]).includes(value)
}

async function getLatestCustomListLeaderboardRefresh(listId: number) {
    const { data, error } = await (supabase as any)
        .from('listLeaderboardRefreshes')
        .select('id, listId, totalPlayers, totalRecords, lastRefreshedAt')
        .eq('listId', listId)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    return (data || null) as CustomListLeaderboardRefreshRow | null
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ValidationError'
    }
}

export class ForbiddenError extends Error {
    constructor(message: string = 'Forbidden') {
        super(message)
        this.name = 'ForbiddenError'
    }
}

export class NotFoundError extends Error {
    constructor(message: string = 'Not found') {
        super(message)
        this.name = 'NotFoundError'
    }
}

export class ConflictError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ConflictError'
    }
}

const WEIGHT_FORMULA_DISABLED_FUNCTIONS = [
    'import',
    'createUnit',
    'reviver',
    'evaluate',
    'parse',
    'simplify',
    'derivative',
    'resolve',
    'parser'
] as const

const weightFormulaMath = create(all)
const parseWeightFormulaNode = weightFormulaMath.parse.bind(weightFormulaMath)

weightFormulaMath.import(
    Object.fromEntries(
        WEIGHT_FORMULA_DISABLED_FUNCTIONS.map((functionName) => [
            functionName,
            () => {
                throw new ValidationError(`weightFormula function "${functionName}" is disabled`)
            }
        ])
    ),
    { override: true }
)

function getWeightFormulaNodeType(node: any) {
    if (typeof node?.type === 'string') {
        return node.type
    }

    if (typeof node?.mathjs === 'string') {
        return node.mathjs
    }

    return null
}

function assertWeightFormulaNodeIsSafe(node: any) {
    node.traverse((child: any) => {
        if (getWeightFormulaNodeType(child) === 'FunctionAssignmentNode') {
            throw new ValidationError('weightFormula custom functions are disabled')
        }
    })
}

function validateWeightFormulaExpression(value: string) {
    try {
        const node = parseWeightFormulaNode(value)
        assertWeightFormulaNodeIsSafe(node)
        return node
    } catch (error) {
        if (error instanceof ValidationError) {
            throw error
        }

        throw new ValidationError('weightFormula must be a valid math expression')
    }
}

function normalizeWeightFormulaResult(result: unknown): number {
    if (result && typeof result === 'object' && Array.isArray((result as { entries?: unknown[] }).entries)) {
        const entries = (result as { entries: unknown[] }).entries

        for (let index = entries.length - 1; index >= 0; index -= 1) {
            if (entries[index] !== undefined) {
                return normalizeWeightFormulaResult(entries[index])
            }
        }
    }

    if (typeof result === 'boolean' || typeof result === 'string' || Array.isArray(result) || result == null) {
        throw new ValidationError('weightFormula must evaluate to a finite number')
    }

    const normalized = typeof result === 'number' ? result : Number(result)

    if (!Number.isFinite(normalized)) {
        throw new ValidationError('weightFormula must evaluate to a finite number')
    }

    return normalized
}

function evaluateWeightFormulaExpression(value: string, scope: {
    position: number
    levelCount: number
    top: number
    rating: number
    time: number
    baseTime: number
    minProgress: number
    progress: number
}) {
    const node = validateWeightFormulaExpression(value)
    try {
        return normalizeWeightFormulaResult(node.compile().evaluate({ ...scope }))
    } catch (error) {
        if (error instanceof ValidationError) {
            throw error
        }

        throw new ValidationError(error instanceof Error ? error.message : 'weightFormula must evaluate to a finite number')
    }
}

async function ensureUniqueListSlug(slug: string, excludeListId?: number) {
    let query = supabase
        .from('lists')
        .select('id')
        .eq('slug', slug)

    if (excludeListId) {
        query = query.neq('id', excludeListId)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    if (data) {
        throw new ConflictError('Slug is already in use')
    }
}

function requireListId(value: number) {
    if (!Number.isInteger(value) || value <= 0) {
        throw new ValidationError('Invalid list ID')
    }
}

function requireLevelId(value: number) {
    if (!Number.isInteger(value) || value <= 0) {
        throw new ValidationError('Invalid level ID')
    }
}

function sanitizeTitle(value: unknown) {
    if (typeof value !== 'string') {
        throw new ValidationError('Title is required')
    }

    const title = value.trim()

    if (!title.length) {
        throw new ValidationError('Title is required')
    }

    if (title.length > 100) {
        throw new ValidationError('Title must be at most 100 characters')
    }

    return title
}

function sanitizeSlug(value: unknown) {
    if (value == null || value === '') {
        return null
    }

    if (typeof value !== 'string') {
        throw new ValidationError('Slug must be a string')
    }

    const slug = value.trim().toLowerCase()

    if (!SLUG_PATTERN.test(slug)) {
        throw new ValidationError('Slug must contain only lowercase letters, numbers, and hyphens')
    }

    if (slug.length > 100) {
        throw new ValidationError('Slug must be at most 100 characters')
    }

    return slug
}

function sanitizeDescription(value: unknown) {
    if (value == null) {
        return ''
    }

    if (typeof value !== 'string') {
        throw new ValidationError('Description must be a string')
    }

    const description = value.trim()

    if (description.length > 2000) {
        throw new ValidationError('Description must be at most 2000 characters')
    }

    return description
}

function sanitizeVisibility(value: unknown) {
    if (value == null) {
        return 'private'
    }

    if (typeof value !== 'string') {
        throw new ValidationError('Visibility must be a string')
    }

    const visibility = value.trim().toLowerCase()

    if (!VISIBILITY_VALUES.has(visibility)) {
        throw new ValidationError('Visibility must be private, unlisted, or public')
    }

    return visibility
}

function sanitizeMode(value: unknown) {
    if (value == null) {
        return 'rating'
    }

    if (typeof value !== 'string') {
        throw new ValidationError('Mode must be a string')
    }

    const mode = value.trim().toLowerCase()

    if (!MODE_VALUES.has(mode)) {
        throw new ValidationError('Mode must be rating or top')
    }

    return mode as 'rating' | 'top'
}

function sanitizeListPlatformer(value: unknown) {
    if (value == null) {
        return false
    }

    if (typeof value !== 'boolean') {
        throw new ValidationError('isPlatformer must be a boolean')
    }

    return value
}

function sanitizeCommunityEnabled(value: unknown) {
    if (value == null) {
        return true
    }

    if (typeof value !== 'boolean') {
        throw new ValidationError('communityEnabled must be a boolean')
    }

    return value
}

function sanitizeOfficial(value: unknown) {
    if (value == null) {
        return false
    }

    if (typeof value !== 'boolean') {
        throw new ValidationError('isOfficial must be a boolean')
    }

    return value
}

function sanitizeListBanState(value: unknown) {
    if (typeof value !== 'boolean') {
        throw new ValidationError('isBanned must be a boolean')
    }

    return value
}

function sanitizeWeightFormula(value: unknown) {
    if (value == null) {
        return '1'
    }

    if (typeof value !== 'string') {
        throw new ValidationError('weightFormula must be a string')
    }

    const weightFormula = value.trim()

    if (!weightFormula.length) {
        throw new ValidationError('weightFormula is required')
    }

    if (weightFormula.length > 500) {
        throw new ValidationError('weightFormula must be at most 500 characters')
    }

    evaluateWeightFormulaExpression(weightFormula, WEIGHT_FORMULA_VALIDATION_SCOPE)

    return weightFormula
}

function sanitizeRating(value: unknown) {
    const n = Number(value)
    if (!Number.isInteger(n) || n < 1 || n > 10) {
        throw new ValidationError('Rating must be an integer between 1 and 10')
    }
    return n
}

function sanitizeMinProgress(value: unknown, isPlatformer: boolean) {
    if (value == null || value === '') {
        return null
    }

    const minProgress = Number(value)

    if (!Number.isInteger(minProgress)) {
        throw new ValidationError('Min progress must be an integer')
    }

    if (isPlatformer) {
        if (minProgress < 0) {
            throw new ValidationError('Platformer base time must be 0 or greater')
        }

        return minProgress
    }

    if (minProgress < 0 || minProgress > 100) {
        throw new ValidationError('Min progress must be between 0 and 100')
    }

    return minProgress
}

function sanitizeTags(value: unknown) {
    if (value == null) {
        return []
    }

    if (!Array.isArray(value)) {
        throw new ValidationError('Tags must be an array of strings')
    }

    const seen = new Set<string>()
    const tags: string[] = []

    for (const entry of value) {
        if (typeof entry !== 'string') {
            throw new ValidationError('Tags must be an array of strings')
        }

        const tag = entry.trim()

        if (!tag.length) {
            continue
        }

        if (tag.length > 30) {
            throw new ValidationError('Each tag must be at most 30 characters')
        }

        const normalized = tag.toLowerCase()

        if (seen.has(normalized)) {
            continue
        }

        seen.add(normalized)
        tags.push(tag)

        if (tags.length > 10) {
            throw new ValidationError('A list can have at most 10 tags')
        }
    }

    return tags
}

async function getCustomListRow(listId: number) {
    requireListId(listId)

    const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('id', listId)
        .single()

    if (error || !data) {
        throw new NotFoundError('List not found')
    }

    return data
}

async function getCustomListBySlug(slug: string) {
    const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('slug', slug)
        .single()

    if (error || !data) {
        throw new NotFoundError('List not found')
    }

    return data
}

function getEffectiveMinProgress(item: any) {
    return item.minProgress ?? item.level?.minProgress ?? null
}

function getNormalizedListPosition(item: any, index: number, isSyntheticOfficialList: boolean) {
    if (item.position == null) {
        return index + 1
    }

    return isSyntheticOfficialList ? Number(item.position) : Number(item.position) + 1
}

function getItemIsPlatformer(item: any, fallbackIsPlatformer: boolean) {
    return Boolean(item.level?.isPlatformer ?? fallbackIsPlatformer)
}

function isBetterRecordForListItem(candidate: { progress?: number | null } | null | undefined, existing: { progress?: number | null } | null | undefined, item: any, isPlatformer: boolean) {
    if (!candidate) {
        return false
    }

    if (!existing) {
        return true
    }

    const candidateProgress = Number(candidate.progress)
    const existingProgress = Number(existing.progress)

    if (!Number.isFinite(candidateProgress)) {
        return false
    }

    if (!Number.isFinite(existingProgress)) {
        return true
    }

    return getItemIsPlatformer(item, isPlatformer)
        ? candidateProgress < existingProgress
        : candidateProgress > existingProgress
}

function isEligibleRecordForListItem(
    record: { progress?: number | null } | null | undefined,
    item: any,
    isPlatformer: boolean,
    options?: {
        ignorePlatformerMinProgress?: boolean
    }
) {
    if (!record) {
        return false
    }

    const progress = Number(record.progress)

    if (!Number.isFinite(progress)) {
        return false
    }

    const minProgress = getEffectiveMinProgress(item)
    const itemIsPlatformer = getItemIsPlatformer(item, isPlatformer)

    if (itemIsPlatformer && options?.ignorePlatformerMinProgress) {
        return true
    }

    if (minProgress == null) {
        return true
    }

    return itemIsPlatformer ? progress <= minProgress : progress >= minProgress
}

function roundCustomListSnapshotValue(value: number, digits: number = 3) {
    const factor = 10 ** digits
    const rounded = Math.round(value * factor) / factor

    return Object.is(rounded, -0) ? 0 : rounded
}

function getCustomListRecordPoint(
    list: Awaited<ReturnType<typeof getCustomList>>,
    item: any,
    itemIndex: number,
    position: number,
    levelCount: number,
    record: { progress?: number | null }
) {
	const progress = Math.max(0, Number(record.progress) || 0)
	const minProgress = Number(getEffectiveMinProgress(item) ?? 0)
	const recordPoint = evaluateWeightFormulaExpression(list.weightFormula || '1', {
        position,
        levelCount,
        top: getNormalizedListPosition(item, itemIndex, list.id < 0),
        rating: Number(item.rating ?? item.level?.rating ?? 0),
		time: progress,
		baseTime: minProgress,
        minProgress,
        progress
    })

	return roundCustomListSnapshotValue(recordPoint)
}

async function enrichItemsWithViewerEligibleRecords(items: any[], list: { isPlatformer: boolean }, viewerId?: string) {
    if (!viewerId || !items.length) {
        return items
    }

    const levelIds = [...new Set(items.map((item) => item.levelId))]
    const itemsByLevelId = new Map(items.map((item) => [item.levelId, item]))

    if (!levelIds.length) {
        return items
    }

    const recordsByLevelId = new Map<number, any>()

    for (let start = 0; ; start += CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE) {
        const end = start + CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE - 1
        const { data, error } = await supabase
            .from('records')
            .select('levelid, progress, isChecked')
            .eq('userid', viewerId)
            .in('levelid', levelIds)
            .range(start, end)

        if (error) {
            throw new Error(error.message)
        }

        if (!data?.length) {
            break
        }

        for (const record of data) {
            const item = itemsByLevelId.get(record.levelid)

            if (!item) {
                continue
            }

            const existingRecord = recordsByLevelId.get(record.levelid)

            if (isBetterRecordForListItem(record, existingRecord, item, list.isPlatformer)) {
                recordsByLevelId.set(record.levelid, record)
            }
        }

        if (data.length < CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE) {
            break
        }
    }

    return items.map((item) => {
        const record = recordsByLevelId.get(item.levelId)
        const eligibleRecord = isEligibleRecordForListItem(record, item, list.isPlatformer)
            ? {
                isChecked: Boolean(record?.isChecked),
                progress: Number(record?.progress) || 0
            }
            : null

        if (!item.level) {
            return item
        }

        return {
            ...item,
            level: {
                ...item.level,
                record: eligibleRecord
            }
        }
    })
}

async function getOfficialList(slug: OfficialListSlug, viewerId?: string, itemRange?: {
    start?: number
    end?: number
}) {
    const config = getOfficialListConfig(slug)
    const hasItemRange = itemRange?.start !== undefined && itemRange?.end !== undefined
    const rangeStart = hasItemRange ? (itemRange.start ?? 0) : 0
    const rangeEnd = hasItemRange ? (itemRange.end ?? 4999) : 4999
    const [levels, totalLevels] = hasItemRange
        ? await Promise.all([
            config.loadLevels({ start: rangeStart, end: rangeEnd, uid: viewerId || '' }),
            config.loadLevels({ start: 0, end: 4999, uid: '' }).then((entries) => entries.length)
        ])
        : [await config.loadLevels({ start: 0, end: 4999, uid: viewerId || '' }), undefined]
    const levelCount = totalLevels ?? levels.length

    const list = {
        id: -1,
        slug: config.slug,
        owner: '',
        title: config.title,
        description: config.description,
        visibility: 'public',
        tags: ['official'],
        levelCount,
        isPlatformer: config.isPlatformer,
        isOfficial: true,
        communityEnabled: false,
        mode: config.mode,
        weightFormula: config.weightFormula,
        lastRefreshedAt: null,
        updated_at: new Date().toISOString(),
        starCount: 0,
        starred: false,
        items: levels.map((level: any, index: number) => ({
            id: -(index + 1),
            created_at: level.created_at || new Date().toISOString(),
            listId: -1,
            levelId: level.id,
            addedBy: '',
            rating: level.rating ?? 1,
            position: level.flTop ?? level.dlTop ?? (rangeStart + index),
            minProgress: level.minProgress ?? null,
            level
        }))
    }

    return {
        ...list,
        items: await enrichItemsWithViewerEligibleRecords(list.items, list, viewerId)
    }
}

async function getOfficialListSummary(slug: OfficialListSlug) {
    const list = await getOfficialList(slug)

    return {
        id: list.id,
        slug: list.slug,
        owner: list.owner,
        title: list.title,
        description: list.description,
        visibility: list.visibility,
        tags: list.tags,
        levelCount: list.levelCount,
        isPlatformer: list.isPlatformer,
        isOfficial: list.isOfficial,
        communityEnabled: list.communityEnabled,
        mode: list.mode,
        weightFormula: list.weightFormula,
        lastRefreshedAt: list.lastRefreshedAt,
        updated_at: list.updated_at,
        starCount: 0,
        starred: false
    }
}

async function fetchCustomListLeaderboardSourceRecords(levelIds: number[]) {
    if (!levelIds.length) {
        return [] as any[]
    }

    const rows: any[] = []

    // Supabase caps uncapped select queries at 1000 rows, so page until the filtered result set is exhausted.
    for (let start = 0; ; start += CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE) {
        const end = start + CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE - 1
        const { data, error } = await supabase
            .from('records')
            .select('userid, levelid, progress, timestamp, players!userid!inner(uid)')
            .eq('isChecked', true)
            .eq('players.isHidden', false)
            .in('levelid', levelIds)
            .order('userid', { ascending: true })
            .order('levelid', { ascending: true })
            .range(start, end)

        if (error) {
            throw new Error(error.message)
        }

        if (!data?.length) {
            break
        }

        rows.push(...data)

        if (data.length < CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE) {
            break
        }
    }

    return rows
}

async function fetchCustomListLeaderboardPlayers(uids: string[]) {
    const playersByUid = new Map<string, any>()

    for (let start = 0; start < uids.length; start += CUSTOM_LIST_LEADERBOARD_PLAYER_BATCH_SIZE) {
        const uidBatch = uids.slice(start, start + CUSTOM_LIST_LEADERBOARD_PLAYER_BATCH_SIZE)

        if (!uidBatch.length) {
            continue
        }

        const { data, error } = await supabase
            .from('players')
            .select(playerSelect)
            .eq('isHidden', false)
            .in('uid', uidBatch)

        if (error) {
            throw new Error(error.message)
        }

        for (const player of data || []) {
            playersByUid.set(player.uid, player)
        }
    }

    return playersByUid
}

async function calculateCustomListLeaderboardSnapshot(list: Awaited<ReturnType<typeof getCustomList>>) {
    const items = list.items || []

    if (!items.length) {
        return {
            rankedPlayers: [] as CustomListLeaderboardEntry[],
            rankedRecords: [] as CustomListLeaderboardRecordEntry[]
        }
    }

    const levelIds = [...new Set(items.map((item: any) => item.levelId))]
    const itemByLevelId = new Map(items.map((item: any, index: number) => [item.levelId, { item, index }]))
    const isTop = list.mode === 'top'

    const data = await fetchCustomListLeaderboardSourceRecords(levelIds)

    // Step 1: Collect best record per (uid, levelId)
    const bestRecords = new Map<string, { record: any; itemData: { item: any; index: number } }>()

    for (const record of (data || []) as any[]) {
        const itemData = itemByLevelId.get(record.levelid)

        if (!itemData) {
            continue
        }

        if (!isEligibleRecordForListItem(record, itemData.item, list.isPlatformer, {
            ignorePlatformerMinProgress: list.isPlatformer
        })) {
            continue
        }

        const key = `${record.userid}:${record.levelid}`
        const existing = bestRecords.get(key)

        if (!existing || isBetterRecordForListItem(record, existing.record, itemData.item, list.isPlatformer)) {
            bestRecords.set(key, { record, itemData })
        }
    }

    // Step 2: Group by uid
    const recordsByUid = new Map<string, Array<{ record: any; itemData: { item: any; index: number } }>>()

    for (const entry of bestRecords.values()) {
        const uid = entry.record.userid
        let group = recordsByUid.get(uid)

        if (!group) {
            group = []
            recordsByUid.set(uid, group)
        }

        group.push(entry)
    }

    // Step 3: Sort each uid's records by level rating/position, assign no, then evaluate formula
    const playerScores = new Map<string, {
        player: any
        score: number
        completedCount: number
    }>()
    const rankedRecords: CustomListLeaderboardRecordEntry[] = []

    const playersByUid = await fetchCustomListLeaderboardPlayers([...recordsByUid.keys()])

    for (const [uid, entries] of recordsByUid) {
        const player = playersByUid.get(uid)

        if (!player) {
            continue
        }

        entries.sort((a, b) => {
            if (isTop) {
                const aPos = getNormalizedListPosition(a.itemData.item, a.itemData.index, list.id < 0)
                const bPos = getNormalizedListPosition(b.itemData.item, b.itemData.index, list.id < 0)
                return aPos - bPos
            }

            const aRating = Number(a.itemData.item.rating ?? a.itemData.item.level?.rating ?? 0)
            const bRating = Number(b.itemData.item.rating ?? b.itemData.item.level?.rating ?? 0)
            return bRating - aRating
        })

        let totalScore = 0

        for (let i = 0; i < entries.length; i++) {
            const { record, itemData } = entries[i]
            const no = i + 1
            const recordPoint = getCustomListRecordPoint(
                list,
                itemData.item,
                itemData.index,
                no,
                items.length,
                record
            )

            rankedRecords.push({
                uid,
                levelId: record.levelid,
                point: recordPoint,
                no
            })

            totalScore += recordPoint
        }

        playerScores.set(uid, {
            player,
            score: totalScore,
            completedCount: entries.length
        })
    }

    const rankedPlayers = [...playerScores.values()]
        .sort((left, right) => {
            if (right.score !== left.score) {
                return right.score - left.score
            }

            if (right.completedCount !== left.completedCount) {
                return right.completedCount - left.completedCount
            }

            return String(left.player?.name || '').localeCompare(String(right.player?.name || ''))
        })
        .map((entry, index) => ({
            ...entry.player,
            rank: index + 1,
            score: roundCustomListSnapshotValue(entry.score),
            completedCount: entry.completedCount
        }))

    return {
        rankedPlayers,
        rankedRecords
    }
}

async function persistCustomListLeaderboard(
    listId: number,
    rankedPlayers: CustomListLeaderboardEntry[],
    rankedRecords: CustomListLeaderboardRecordEntry[]
) {
    const lastRefreshedAt = new Date().toISOString()

    const { data: refreshRow, error: refreshError } = await (supabase as any)
        .from('listLeaderboardRefreshes')
        .upsert({
            listId,
            totalPlayers: rankedPlayers.length,
            totalRecords: rankedRecords.length,
            lastRefreshedAt
        }, {
            onConflict: 'listId'
        })
        .select('id, listId, totalPlayers, totalRecords, lastRefreshedAt')
        .single()

    if (refreshError || !refreshRow) {
        throw new Error(refreshError?.message || 'Failed to persist leaderboard refresh')
    }

    const [{ error: deleteLeaderboardError }, { error: deleteRecordsError }] = await Promise.all([
        (supabase as any)
            .from('listLeaderboardEntries')
            .delete()
            .eq('listId', listId),
        (supabase as any)
            .from('listLeaderboardRecordEntries')
            .delete()
            .eq('listId', listId)
    ])

    if (deleteLeaderboardError) {
        throw new Error(deleteLeaderboardError.message)
    }

    if (deleteRecordsError) {
        throw new Error(deleteRecordsError.message)
    }

    const writes: PromiseLike<{ error: { message: string } | null }>[] = []

    if (rankedPlayers.length) {
        writes.push(
            (supabase as any)
                .from('listLeaderboardEntries')
                .insert(rankedPlayers.map((entry) => ({
                    listId,
                    uid: entry.uid,
                    rank: entry.rank,
                    score: entry.score,
                    completedCount: entry.completedCount
                })))
        )
    }

    if (rankedRecords.length) {
        writes.push(
            (supabase as any)
                .from('listLeaderboardRecordEntries')
                .insert(rankedRecords.map((entry) => ({
                    listId,
                    uid: entry.uid,
                    levelId: entry.levelId,
                    point: entry.point,
                    no: entry.no
                })))
        )
    }

    if (writes.length) {
        const results = await Promise.all(writes)

        for (const result of results) {
            if (result.error) {
                throw new Error(result.error.message)
            }
        }
    }

    return refreshRow as CustomListLeaderboardRefreshRow
}

export async function resolveCustomListIdentifier(identifier: CustomListIdentifier) {
    if (typeof identifier === 'number') {
        return getCustomListRow(identifier)
    }

    const trimmed = identifier.trim()

    if (!trimmed.length) {
        throw new ValidationError('Invalid list identifier')
    }

    const numericId = Number.parseInt(trimmed, 10)

    if (String(numericId) === trimmed && Number.isInteger(numericId) && numericId > 0) {
        return getCustomListRow(numericId)
    }

    return getCustomListBySlug(sanitizeSlug(trimmed) as string)
}

function getActorUid(actor: CustomListActor) {
    return typeof actor === 'string' ? actor : actor?.uid
}

function canModerateList(actor: CustomListActor) {
    return Boolean(actor && typeof actor !== 'string' && (actor.isAdmin || actor.isManager))
}

function isListOwner(list: Pick<CustomList, 'owner'>, actor: CustomListActor) {
    const actorUid = getActorUid(actor)

    return Boolean(actorUid && list.owner === actorUid)
}

function getRequiredActorUid(actor: CustomListActor) {
    const actorUid = getActorUid(actor)

    if (!actorUid) {
        throw new ForbiddenError('Authentication required')
    }

    return actorUid
}

function assertOwnerEditable(list: CustomList, actor: CustomListActor) {
    if (!isListOwner(list, actor)) {
        throw new ForbiddenError('You do not own this list')
    }

    if (list.isBanned) {
        throw new ForbiddenError('This list has been banned and cannot be edited by the owner')
    }
}

function assertCanEditList(list: CustomList, actor: CustomListActor) {
    if (canModerateList(actor)) {
        return
    }

    assertOwnerEditable(list, actor)
}

function assertReadable(list: CustomList, actor?: CustomListActor) {
    if (list.visibility === 'private' && !isListOwner(list, actor) && !canModerateList(actor)) {
        throw new ForbiddenError('This list is private')
    }
}

function assertLevelTypeMatchesList(list: CustomList, level: { isPlatformer?: boolean | null }) {
    const levelIsPlatformer = Boolean(level.isPlatformer)

    if (levelIsPlatformer !== list.isPlatformer) {
        throw new ValidationError(
            list.isPlatformer
                ? 'This list only accepts platformer levels'
                : 'This list only accepts classic levels'
        )
    }
}

async function assertExistingLevelsMatchType(listId: number, isPlatformer: boolean) {
    const { data: listLevels, error: listLevelsError } = await supabase
        .from('listLevels')
        .select('levelId')
        .eq('listId', listId)

    if (listLevelsError) {
        throw new Error(listLevelsError.message)
    }

    const levelIds = [...new Set((listLevels || []).map((entry) => entry.levelId))]

    if (!levelIds.length) {
        return
    }

    const { data: levels, error: levelsError } = await supabase
        .from('levels')
        .select('id, isPlatformer')
        .in('id', levelIds)

    if (levelsError) {
        throw new Error(levelsError.message)
    }

    const hasMismatch = (levels || []).some((level) => Boolean(level.isPlatformer) !== isPlatformer)

    if (hasMismatch) {
        throw new ValidationError(
            isPlatformer
                ? 'This list already contains classic levels'
                : 'This list already contains platformer levels'
        )
    }
}

async function syncLevelCount(listId: number) {
    const { count, error: countError } = await supabase
        .from('listLevels')
        .select('id', { count: 'exact', head: true })
        .eq('listId', listId)

    if (countError) {
        throw new Error(countError.message)
    }

    const { error: updateError } = await supabase
        .from('lists')
        .update({
            levelCount: count ?? 0,
            updated_at: new Date().toISOString()
        })
        .eq('id', listId)

    if (updateError) {
        throw new Error(updateError.message)
    }
}

export async function touchCustomListActivity(listId: number) {
    const { error } = await supabase
        .from('lists')
        .update({
            updated_at: new Date().toISOString()
        })
        .eq('id', listId)

    if (error) {
        throw new Error(error.message)
    }
}

async function getStarSummary(listIds: number[], viewerId?: string) {
    const counts = new Map<number, number>()
    const starredIds = new Set<number>()

    if (!listIds.length) {
        return { counts, starredIds }
    }

    const { data, error } = await supabase
        .from('listStars')
        .select('listId, uid')
        .in('listId', listIds)

    if (error) {
        throw new Error(error.message)
    }

    for (const star of data || []) {
        counts.set(star.listId, (counts.get(star.listId) || 0) + 1)

        if (viewerId && star.uid === viewerId) {
            starredIds.add(star.listId)
        }
    }

    return { counts, starredIds }
}

async function enrichListsWithStars<T extends { id: number }>(lists: T[], viewerId?: string) {
    const { counts, starredIds } = await getStarSummary(lists.map((list) => list.id), viewerId)

    return lists.map((list) => ({
        ...list,
        starCount: counts.get(list.id) || 0,
        starred: starredIds.has(list.id)
    }))
}

async function getListWithOwnerData(listId: number) {
    requireListId(listId)

    // @ts-ignore
    const { data, error } = await supabase
        .from('lists')
        .select(`*, ownerData:players!lists_owner_fkey(${playerSelect})`)
        .eq('id', listId)
        .single()

    if (error || !data) {
        throw new NotFoundError('List not found')
    }

    return data as CustomListWithOwnerData
}

async function ensureLevelExists(levelId: number) {
    requireLevelId(levelId)

    try {
        return await getLevel(levelId)
    } catch {
        let gdLevel: Awaited<ReturnType<typeof fetchLevelFromGD>>

        try {
            gdLevel = await fetchLevelFromGD(levelId)
        } catch {
            throw new NotFoundError('Level not found on the official Geometry Dash server')
        }

        return await retrieveOrCreateLevel({
            id: levelId,
            name: gdLevel.name,
            creator: gdLevel.author,
            difficulty: gdLevel.difficulty ?? null,
            isPlatformer: gdLevel.length == 5,
            isChallenge: false,
            isNonList: false,
        } as any)
    }
}

async function getCustomListItems(listId: number, mode: string = 'rating', itemRange?: {
    start?: number
    end?: number
}) {
    const isTop = mode === 'top'

    let itemsQuery = supabase
        .from('listLevels')
        .select('id, created_at, listId, levelId, addedBy, rating, position, minProgress')
        .eq('listId', listId)
        .order(isTop ? 'position' : 'rating', { ascending: isTop, nullsFirst: false })

    if (itemRange?.start !== undefined && itemRange?.end !== undefined) {
        itemsQuery = itemsQuery.range(itemRange.start, itemRange.end)
    }

    const { data: items, error: itemsError } = await itemsQuery

    if (itemsError) {
        throw new Error(itemsError.message)
    }

    const levelIds = [...new Set((items || []).map((item) => item.levelId))]

    if (!levelIds.length) {
        return []
    }

    // @ts-ignore
    const { data: levels, error: levelsError } = await supabase
        .from('levels')
        .select('*, creatorData:players!creatorId(*, clans!id(*))')
        .in('id', levelIds)

    if (levelsError) {
        throw new Error(levelsError.message)
    }

    const levelsById = new Map((levels || []).map((level) => [level.id, level]))

    return (items || []).map((item) => ({
        ...item,
        level: levelsById.get(item.levelId) ?? null
    }))
}

export async function getOwnCustomLists(ownerId: string) {
    const { data, error } = await supabase
        .from('lists')
        .select(`*, ownerData:players!lists_owner_fkey(${playerSelect})`)
        .eq('owner', ownerId)
        .order('updated_at', { ascending: false })

    if (error) {
        throw new Error(error.message)
    }

    return enrichListsWithStars((data || []) as CustomListWithOwnerData[], ownerId)
}

export async function getStarredCustomLists(userId: string) {
    const { data: starredEntries, error: starredError } = await supabase
        .from('listStars')
        .select('listId')
        .eq('uid', userId)

    if (starredError) {
        throw new Error(starredError.message)
    }

    const listIds = [...new Set((starredEntries || []).map((entry) => entry.listId))]

    if (!listIds.length) {
        return []
    }


    const { data, error } = await supabase
        .from('lists')
        .select(`*, ownerData:players!lists_owner_fkey(${playerSelect})`)
        .in('id', listIds)
        .order('updated_at', { ascending: false })

    if (error) {
        throw new Error(error.message)
    }

    const readableLists = ((data || []) as CustomListWithOwnerData[])
        .filter((list) => list.visibility !== 'private' || list.owner === userId)

    return enrichListsWithStars(readableLists, userId)
}

export async function browseLists(options: {
    limit?: number
    offset?: number
    search?: string
    viewerId?: string
}) {
    const {
        limit = 24,
        offset = 0,
        search = '',
        viewerId
    } = options

    const normalizedSearch = search.trim().toLowerCase()

    let query = supabase
        .from('lists')
        .select(`*, ownerData:players!lists_owner_fkey(${playerSelect})`, { count: 'exact' })
        .eq('visibility', 'public')

    if (normalizedSearch.length) {
        query = query.or(`title.ilike.%${normalizedSearch}%,description.ilike.%${normalizedSearch}%`)
    }

    const { data, error, count } = await query
        .order('isOfficial', { ascending: false })
        .order('updated_at', { ascending: false })
        .range(0, offset + limit - 1)

    if (error) {
        throw new Error(error.message)
    }

    const databaseLists = await enrichListsWithStars((data || []) as CustomListWithOwnerData[], viewerId)
    const databaseOfficialSlugs = new Set(
        databaseLists
            .map((list) => list.slug)
            .filter((slug): slug is OfficialListSlug => Boolean(slug) && isOfficialListSlug(slug!))
    )
    const syntheticOfficialLists = await Promise.all(
        OFFICIAL_LIST_SLUGS
            .filter((slug) => !databaseOfficialSlugs.has(slug))
            .filter((slug) => {
                if (!normalizedSearch.length) {
                    return true
                }

                const entry = getOfficialListConfig(slug)
                return entry.title.toLowerCase().includes(normalizedSearch)
                    || entry.description.toLowerCase().includes(normalizedSearch)
            })
            .map((slug) => getOfficialListSummary(slug))
    )
    const combinedLists = [...syntheticOfficialLists, ...databaseLists]

    return {
        data: combinedLists.slice(offset, offset + limit),
        total: syntheticOfficialLists.length + (count || 0)
    }
}

export async function getCustomList(listId: CustomListIdentifier, viewerId?: CustomListActor, options: {
    itemsStart?: number
    itemsEnd?: number
} = {}) {
    const actorUid = getActorUid(viewerId)
    const itemRange = options.itemsStart !== undefined && options.itemsEnd !== undefined
        ? {
            start: options.itemsStart,
            end: options.itemsEnd
        }
        : undefined

    try {
        const resolved = await resolveCustomListIdentifier(listId)
        const list = await getListWithOwnerData(resolved.id)
        assertReadable(list, viewerId)

        const items = await enrichItemsWithViewerEligibleRecords(
            await getCustomListItems(list.id, list.mode, itemRange),
            list,
            actorUid
        )
        const [{ starCount = 0, starred = false } = { starCount: 0, starred: false }] = await enrichListsWithStars([list], actorUid)
        const latestRefresh = await getLatestCustomListLeaderboardRefresh(list.id)

        return {
            ...list,
            starCount,
            starred,
            lastRefreshedAt: latestRefresh?.lastRefreshedAt ?? null,
            items
        }
    } catch (error) {
        if (error instanceof NotFoundError && typeof listId === 'string') {
            const normalizedIdentifier = listId.trim().toLowerCase()

            if (isOfficialListSlug(normalizedIdentifier)) {
                return getOfficialList(normalizedIdentifier, actorUid, itemRange)
            }
        }

        throw error
    }
}

export async function getCustomListLeaderboard(identifier: CustomListIdentifier, options: {
    start?: number
    end?: number
    viewerId?: CustomListActor
} = {}) {
    const {
        start = 0,
        end = 49,
        viewerId
    } = options

    const list = await getCustomList(identifier, viewerId)

    if (list.id <= 0) {
        return {
            list,
            data: [],
            total: 0,
            lastRefreshedAt: null
        }
    }

    const latestRefresh = await getLatestCustomListLeaderboardRefresh(list.id)

    if (!latestRefresh) {
        return {
            list,
            data: [],
            total: 0,
            lastRefreshedAt: null
        }
    }

    const { data: entryRows, error: entriesError } = await (supabase as any)
        .from('listLeaderboardEntries')
        .select('uid, rank, score, completedCount')
        .eq('listId', list.id)
        .order('rank', { ascending: true })
        .range(start, end)

    if (entriesError) {
        throw new Error(entriesError.message)
    }

    const entries = (entryRows || []) as Array<{
        uid: string
        rank: number
        score: number
        completedCount: number
    }>
    const uids = [...new Set(entries.map((entry) => entry.uid))]
    const playersByUid = new Map<string, any>()

    if (uids.length) {
        const { data: players, error: playersError } = await supabase
            .from('players')
            .select(`${playerSelect}`)
            .in('uid', uids)

        if (playersError) {
            throw new Error(playersError.message)
        }

        for (const player of players || []) {
            playersByUid.set(player.uid, player)
        }
    }

    const persistedLeaderboard = entries
        .map((entry) => {
            const player = playersByUid.get(entry.uid)

            if (!player) {
                return null
            }

            return {
                ...player,
                rank: entry.rank,
                score: entry.score,
                completedCount: entry.completedCount
            }
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))

    return {
        list,
        data: persistedLeaderboard,
        total: latestRefresh.totalPlayers,
        lastRefreshedAt: latestRefresh.lastRefreshedAt
    }
}

export async function getCustomListRecordPoints(identifier: CustomListIdentifier, options: {
    start?: number
    end?: number
    viewerId?: CustomListActor
    uid?: string
} = {}) {
    const {
        start = 0,
        end = 49,
        viewerId,
        uid
    } = options

    const list = await getCustomList(identifier, viewerId)

    if (list.id <= 0) {
        return {
            list,
            data: [],
            total: 0,
            lastRefreshedAt: null
        }
    }

    const latestRefresh = await getLatestCustomListLeaderboardRefresh(list.id)

    if (!latestRefresh) {
        return {
            list,
            data: [],
            total: 0,
            lastRefreshedAt: null
        }
    }

    let entriesQuery = (supabase as any)
        .from('listLeaderboardRecordEntries')
        .select('uid, levelId, point, no', { count: 'exact' })
        .eq('listId', list.id)
        .order('no', { ascending: true })

    if (uid) {
        entriesQuery = entriesQuery.eq('uid', uid)
    }

    const { data: entryRows, error: entriesError, count: entryCount } = await entriesQuery.range(start, end)

    if (entriesError) {
        throw new Error(entriesError.message)
    }

    const entries = (entryRows || []) as CustomListLeaderboardRecordEntry[]
    const itemByLevelId = new Map(list.items.map((item: any, index: number) => [item.levelId, { item, index }]))
    const uids = [...new Set(entries.map((entry) => entry.uid))]
    const levelIds = [...new Set(entries.map((entry) => entry.levelId))]
    const playersByUid = new Map<string, any>()
    const levelsById = new Map<number, any>()
    const recordsByKey = new Map<string, { progress: number; timestamp: number | null }>()

    const [playersResult, levelsResult] = await Promise.all([
        uids.length
            ? supabase
                .from('players')
                .select(`${playerSelect}`)
                .in('uid', uids)
            : Promise.resolve({ data: [], error: null }),
        levelIds.length
            ? supabase
                .from('levels')
                .select('id, name, creator, difficulty, isPlatformer, rating, minProgress')
                .in('id', levelIds)
            : Promise.resolve({ data: [], error: null })
    ])

    if (playersResult.error) {
        throw new Error(playersResult.error.message)
    }

    if (levelsResult.error) {
        throw new Error(levelsResult.error.message)
    }

    if (entries.length) {
        const recordFilters = entries
            .map((entry) => `and(userid.eq.${entry.uid},levelid.eq.${entry.levelId})`)
            .join(',')

        const { data: recordRows, error: recordsError } = await supabase
            .from('records')
            .select('userid, levelid, progress, timestamp')
            .or(recordFilters)

        if (recordsError) {
            throw new Error(recordsError.message)
        }

        for (const record of recordRows || []) {
            recordsByKey.set(`${record.userid}:${record.levelid}`, {
                progress: Number(record.progress) || 0,
                timestamp: Number.isFinite(Number(record.timestamp)) ? Number(record.timestamp) : null
            })
        }
    }

    for (const player of playersResult.data || []) {
        playersByUid.set(player.uid, player)
    }

    for (const level of levelsResult.data || []) {
        levelsById.set(level.id, level)
    }

    return {
        list,
        data: entries.map((entry) => {
            const recordSnapshot = recordsByKey.get(`${entry.uid}:${entry.levelId}`) || {
                progress: 0,
                timestamp: null
            }
            const itemData = itemByLevelId.get(entry.levelId)

            return {
                ...entry,
                ...recordSnapshot,
                player: playersByUid.get(entry.uid) || null,
                level: levelsById.get(entry.levelId) || null,
                formulaScope: {
                    position: entry.no,
                    levelCount: list.items.length,
                    top: itemData
                        ? getNormalizedListPosition(itemData.item, itemData.index, list.id < 0)
                        : 0,
                    rating: itemData
                        ? Number(itemData.item.rating ?? itemData.item.level?.rating ?? 0)
                        : 0,
                    minProgress: itemData
                        ? Number(getEffectiveMinProgress(itemData.item) ?? 0)
                        : 0,
                    progress: recordSnapshot.progress
                }
            }
        }),
        total: entryCount ?? latestRefresh.totalRecords,
        lastRefreshedAt: latestRefresh.lastRefreshedAt
    }
}

export async function refreshCustomListLeaderboard(identifier: CustomListIdentifier, actor: CustomListActor) {
    const resolved = await resolveCustomListIdentifier(identifier)
    const list = await getCustomListRow(resolved.id)
    assertCanEditList(list, actor)

    const hydratedList = await getCustomList(list.id, actor)
    const { rankedPlayers, rankedRecords } = await calculateCustomListLeaderboardSnapshot(hydratedList)
    const refreshRow = await persistCustomListLeaderboard(list.id, rankedPlayers, rankedRecords)

    return {
        listId: list.id,
        total: refreshRow.totalPlayers,
        totalRecords: refreshRow.totalRecords,
        lastRefreshedAt: refreshRow.lastRefreshedAt
    }
}

export async function getRandomCustomListLevel(identifier: CustomListIdentifier, options: {
    excludeLevelIds?: number[]
    viewerId?: CustomListActor
} = {}) {
    const {
        excludeLevelIds = [],
        viewerId
    } = options

    const list = await getCustomList(identifier, viewerId)
    const excludedLevelIds = new Set(excludeLevelIds)
    const candidates = (list.items || [])
        .filter((item: any, index: number) => item.level && !excludedLevelIds.has(item.levelId))
        .map((item: any, index: number) => ({
            ...item.level,
            rating: item.rating ?? item.level.rating ?? null,
            minProgress: getEffectiveMinProgress(item),
            listPosition: getNormalizedListPosition(item, index, list.id < 0)
        }))

    if (!candidates.length) {
        throw new NotFoundError('No level available for this list')
    }

    const randomIndex = Math.floor(Math.random() * candidates.length)

    return candidates[randomIndex]
}

export async function toggleCustomListStar(listId: number, userId: string) {
    const list = await getCustomListRow(listId)
    assertReadable(list, userId)

    const { data: existing, error: existingError } = await supabase
        .from('listStars')
        .select('id')
        .eq('listId', listId)
        .eq('uid', userId)
        .maybeSingle()

    if (existingError) {
        throw new Error(existingError.message)
    }

    let starred = false

    if (existing) {
        const { error } = await supabase
            .from('listStars')
            .delete()
            .eq('id', existing.id)

        if (error) {
            throw new Error(error.message)
        }
    } else {
        const starInsert: CustomListStarInsert = {
            listId,
            uid: userId
        }

        const { error } = await supabase
            .from('listStars')
            .insert(starInsert)

        if (error) {
            if (error.code === '23505') {
                throw new ConflictError('List already starred')
            }

            throw new Error(error.message)
        }

        starred = true
    }

    await touchCustomListActivity(listId)

    const { counts } = await getStarSummary([listId], userId)

    return {
        starred,
        starCount: counts.get(listId) || 0
    }
}

export async function getStarredListsByLevel(levelId: number, viewerId?: string) {
    requireLevelId(levelId)

    const { data: listLevels, error: listLevelsError } = await supabase
        .from('listLevels')
        .select('listId, created_at, rating, position, minProgress')
        .eq('levelId', levelId)

    if (listLevelsError) {
        throw new Error(listLevelsError.message)
    }

    const listIds = [...new Set((listLevels || []).map((entry) => entry.listId))]
    const listItemsById = new Map((listLevels || []).map((entry) => [entry.listId, entry]))

    if (!listIds.length) {
        return []
    }

    const { data: lists, error: listsError } = await supabase
        .from('lists')
        .select(`*, ownerData:players!lists_owner_fkey(${playerSelect})`)
        .eq('visibility', 'public')
        .in('id', listIds)
        .order('updated_at', { ascending: false })

    if (listsError) {
        throw new Error(listsError.message)
    }

    const enriched = await enrichListsWithStars((lists || []) as CustomListWithOwnerData[], viewerId)

    return enriched
        .filter((list) => list.starCount > 0)
        .sort((left, right) => {
            if (right.starCount !== left.starCount) {
                return right.starCount - left.starCount
            }

            return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
        })
        .map((list) => ({
            ...list,
            item: listItemsById.get(list.id) || null
        }))
}

export async function createCustomList(ownerId: string, payload: {
    title: unknown
    description?: unknown
    visibility?: unknown
    tags?: unknown
    mode?: unknown
    isPlatformer?: unknown
    communityEnabled?: unknown
    slug?: unknown
    isOfficial?: unknown
    weightFormula?: unknown
}) {
    const listInsert: CustomListInsert = {
        owner: ownerId,
        title: sanitizeTitle(payload.title),
        description: sanitizeDescription(payload.description),
        visibility: sanitizeVisibility(payload.visibility),
        tags: sanitizeTags(payload.tags),
        mode: sanitizeMode(payload.mode),
        isPlatformer: sanitizeListPlatformer(payload.isPlatformer),
        communityEnabled: sanitizeCommunityEnabled(payload.communityEnabled),
        slug: sanitizeSlug(payload.slug),
        isOfficial: false,
        weightFormula: sanitizeWeightFormula(payload.weightFormula),
        updated_at: new Date().toISOString()
    }

    if (listInsert.slug) {
        await ensureUniqueListSlug(listInsert.slug)
    }

    const { data, error } = await supabase
        .from('lists')
        .insert(listInsert)
        .select('*')
        .single()

    if (error || !data) {
        throw new Error(error?.message || 'Failed to create list')
    }

    return {
        ...data,
        items: []
    }
}

export async function updateCustomList(listId: number, ownerId: CustomListActor, payload: {
    title?: unknown
    description?: unknown
    visibility?: unknown
    tags?: unknown
    mode?: unknown
    isPlatformer?: unknown
    communityEnabled?: unknown
    slug?: unknown
    weightFormula?: unknown
}) {
    const existing = await getCustomListRow(listId)
    assertCanEditList(existing, ownerId)

    const updates: CustomListUpdate = {
        updated_at: new Date().toISOString()
    }

    if (payload.title !== undefined) {
        updates.title = sanitizeTitle(payload.title)
    }

    if (payload.description !== undefined) {
        updates.description = sanitizeDescription(payload.description)
    }

    if (payload.visibility !== undefined) {
        const visibility = sanitizeVisibility(payload.visibility)

        if (existing.isBanned && visibility !== 'private') {
            throw new ValidationError('Banned lists must remain private')
        }

        updates.visibility = visibility
    }

    if (payload.tags !== undefined) {
        updates.tags = sanitizeTags(payload.tags)
    }

    if (payload.mode !== undefined) {
        updates.mode = sanitizeMode(payload.mode)
    }

    if (payload.isPlatformer !== undefined) {
        const isPlatformer = sanitizeListPlatformer(payload.isPlatformer)

        if (isPlatformer !== existing.isPlatformer) {
            await assertExistingLevelsMatchType(listId, isPlatformer)
        }

        updates.isPlatformer = isPlatformer
    }

    if (payload.communityEnabled !== undefined) {
        updates.communityEnabled = sanitizeCommunityEnabled(payload.communityEnabled)
    }

    if (payload.slug !== undefined) {
        const slug = sanitizeSlug(payload.slug)

        if (slug) {
            await ensureUniqueListSlug(slug, listId)
        }

        updates.slug = slug
    }

    if (payload.weightFormula !== undefined) {
        updates.weightFormula = sanitizeWeightFormula(payload.weightFormula)
    }

    const { error } = await supabase
        .from('lists')
        .update(updates)
        .eq('id', listId)

    if (error) {
        throw new Error(error.message)
    }

    return getCustomList(listId, ownerId)
}

export async function setCustomListBanState(listId: number, actor: CustomListActor, value: unknown) {
    const existing = await getCustomListRow(listId)

    if (!canModerateList(actor)) {
        throw new ForbiddenError('Only managers can ban custom lists')
    }

    if (existing.isOfficial) {
        throw new ForbiddenError('Official lists cannot be banned')
    }

    const isBanned = sanitizeListBanState(value)
    const updates: CustomListUpdate = {
        isBanned,
        updated_at: new Date().toISOString()
    }

    if (isBanned) {
        updates.visibility = 'private'
    }

    const { error } = await supabase
        .from('lists')
        .update(updates)
        .eq('id', listId)

    if (error) {
        throw new Error(error.message)
    }

    return getCustomList(listId, actor)
}

export async function updateCustomListOfficialMetadata(listId: number, payload: {
    isOfficial?: unknown
    slug?: unknown
    weightFormula?: unknown
}) {
    const existing = await getCustomListRow(listId)

    const updates: CustomListUpdate = {
        updated_at: new Date().toISOString()
    }

    if (payload.isOfficial !== undefined) {
        updates.isOfficial = sanitizeOfficial(payload.isOfficial)
    }

    if (payload.slug !== undefined) {
        const slug = sanitizeSlug(payload.slug)

        if (slug) {
            await ensureUniqueListSlug(slug, listId)
        }

        updates.slug = slug
    }

    if (payload.weightFormula !== undefined) {
        updates.weightFormula = sanitizeWeightFormula(payload.weightFormula)
    }

    const { error } = await supabase
        .from('lists')
        .update(updates)
        .eq('id', existing.id)

    if (error) {
        throw new Error(error.message)
    }

    return getCustomList(existing.id)
}

export async function deleteCustomList(listId: number, ownerId: CustomListActor) {
    const existing = await getCustomListRow(listId)
    assertOwnerEditable(existing, ownerId)

    if (existing.isOfficial) {
        throw new ForbiddenError('Official lists cannot be deleted')
    }

    const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId)

    if (error) {
        throw new Error(error.message)
    }
}

export async function addLevelToCustomList(listId: number, ownerId: CustomListActor, levelId: number) {
    const list = await getCustomListRow(listId)
    const actorUid = getRequiredActorUid(ownerId)
    assertCanEditList(list, ownerId)

    const level = await ensureLevelExists(levelId)
    assertLevelTypeMatchesList(list, level)

    const itemInsert: CustomListLevelInsert = {
        listId,
        levelId,
        addedBy: actorUid,
        minProgress: null
    }

    const { error } = await supabase
        .from('listLevels')
        .insert(itemInsert)

    if (error) {
        if (error.code === '23505') {
            throw new ConflictError('Level already exists in this list')
        }

        throw new Error(error.message)
    }

    await syncLevelCount(listId)

    return getCustomList(listId, ownerId)
}

export async function removeLevelFromCustomList(listId: number, ownerId: CustomListActor, levelId: number) {
    const list = await getCustomListRow(listId)
    assertCanEditList(list, ownerId)

    const { data, error } = await supabase
        .from('listLevels')
        .delete()
        .eq('listId', listId)
        .eq('levelId', levelId)
        .select('id')
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    if (!data) {
        throw new NotFoundError('Level is not in this list')
    }

    await syncLevelCount(listId)

    return getCustomList(listId, ownerId)
}

export async function updateListLevel(listId: number, ownerId: CustomListActor, levelId: number, patch: {
    rating?: unknown
    minProgress?: unknown
}) {
    const list = await getCustomListRow(listId)
    assertCanEditList(list, ownerId)

    const updates: Record<string, unknown> = {}

    if (patch.rating !== undefined) {
        updates.rating = sanitizeRating(patch.rating)
    }

    if (patch.minProgress !== undefined) {
        updates.minProgress = sanitizeMinProgress(patch.minProgress, list.isPlatformer)
    }

    if (!Object.keys(updates).length) {
        return getCustomList(listId, ownerId)
    }

    const { data, error } = await supabase
        .from('listLevels')
        .update(updates)
        .eq('listId', listId)
        .eq('levelId', levelId)
        .select('id')
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    if (!data) {
        throw new NotFoundError('Level is not in this list')
    }

    await touchCustomListActivity(listId)

    return getCustomList(listId, ownerId)
}

export async function reorderListLevels(listId: number, ownerId: CustomListActor, levelIds: unknown) {
    const list = await getCustomListRow(listId)
    assertCanEditList(list, ownerId)

    if (list.mode !== 'top') {
        throw new ValidationError('Reordering is only available in top mode')
    }

    if (!Array.isArray(levelIds) || !levelIds.every((id) => Number.isInteger(id) && id > 0)) {
        throw new ValidationError('levelIds must be an array of positive integers')
    }

    const updates = (levelIds as number[]).map((levelId, index) =>
        supabase
            .from('listLevels')
            .update({ position: index })
            .eq('listId', listId)
            .eq('levelId', levelId)
    )

    const results = await Promise.all(updates)

    for (const result of results) {
        if (result.error) {
            throw new Error(result.error.message)
        }
    }

    await touchCustomListActivity(listId)

    return getCustomList(listId, ownerId)
}