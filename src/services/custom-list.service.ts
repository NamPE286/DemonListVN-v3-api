import supabase from '@src/client/supabase'
import {
    abs,
    ceil,
    floor,
    max,
    min,
    parse,
    pow,
    round,
    sqrt
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

const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

type CustomListWithOwnerData = CustomList & {
    ownerData?: any
}

const VISIBILITY_VALUES = new Set(['private', 'unlisted', 'public'])
const MODE_VALUES = new Set(['rating', 'top'])
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const WEIGHT_FORMULA_SCOPE_KEYS = new Set(['position', 'levelCount', 'rating', 'minProgress'])
const WEIGHT_FORMULA_FUNCTIONS = {
    abs,
    ceil,
    floor,
    max,
    min,
    pow,
    round,
    sqrt
}
const WEIGHT_FORMULA_FUNCTION_KEYS = new Set(Object.keys(WEIGHT_FORMULA_FUNCTIONS))
const OFFICIAL_LISTS = {
    dl: {
        slug: 'dl',
        title: 'Classic List',
        description: 'Official Geometry Dash Việt Nam classic demon list.',
        mode: 'top',
        isPlatformer: false,
        loadLevels: getDemonListLevels
    },
    pl: {
        slug: 'pl',
        title: 'Platformer List',
        description: 'Official Geometry Dash Việt Nam platformer list.',
        mode: 'top',
        isPlatformer: true,
        loadLevels: getPlatformerListLevels
    },
    fl: {
        slug: 'fl',
        title: 'Featured List',
        description: 'Official Geometry Dash Việt Nam featured list.',
        mode: 'top',
        isPlatformer: false,
        loadLevels: getFeaturedListLevels
    },
    cl: {
        slug: 'cl',
        title: 'Challenge List',
        description: 'Official Geometry Dash Việt Nam challenge list.',
        mode: 'top',
        isPlatformer: false,
        loadLevels: getChallengeListLevels
    }
} as const

export type CustomListIdentifier = number | string

type OfficialListSlug = keyof typeof OFFICIAL_LISTS

function isOfficialListSlug(value: string): value is OfficialListSlug {
    return value in OFFICIAL_LISTS
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

function validateWeightFormulaExpression(value: string) {
    try {
        const node = parse(value)

        node.traverse((child: any) => {
            if ([
                'AccessorNode',
                'ArrayNode',
                'AssignmentNode',
                'BlockNode',
                'ConditionalNode',
                'FunctionAssignmentNode',
                'IndexNode',
                'ObjectNode',
                'RangeNode'
            ].includes(child.type)) {
                throw new ValidationError('weightFormula contains unsupported syntax')
            }

            if (child.type === 'FunctionNode') {
                const functionName = child.fn?.name

                if (typeof functionName !== 'string' || !WEIGHT_FORMULA_FUNCTION_KEYS.has(functionName)) {
                    throw new ValidationError('weightFormula uses an unsupported function')
                }
            }

            if (child.type === 'SymbolNode') {
                const symbolName = child.name

                if (!WEIGHT_FORMULA_SCOPE_KEYS.has(symbolName) && !WEIGHT_FORMULA_FUNCTION_KEYS.has(symbolName)) {
                    throw new ValidationError('weightFormula uses an unsupported variable')
                }
            }
        })

        return node
    } catch (error) {
        if (error instanceof ValidationError) {
            throw error
        }

        throw new ValidationError('weightFormula must be a valid math expression')
    }
}

function evaluateWeightFormulaExpression(value: string, scope: {
    position: number
    levelCount: number
    rating: number
    minProgress: number
}) {
    const node = validateWeightFormulaExpression(value)
    const result = node.compile().evaluate({
        ...WEIGHT_FORMULA_FUNCTIONS,
        ...scope
    })

    if (typeof result !== 'number' || !Number.isFinite(result)) {
        throw new ValidationError('weightFormula must evaluate to a finite number')
    }

    return result
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

    validateWeightFormulaExpression(weightFormula)

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

function isEligibleRecordForListItem(record: { progress?: number | null } | null | undefined, item: any, isPlatformer: boolean) {
    if (!record) {
        return false
    }

    const progress = Number(record.progress)

    if (!Number.isFinite(progress)) {
        return false
    }

    const minProgress = getEffectiveMinProgress(item)
    const itemIsPlatformer = getItemIsPlatformer(item, isPlatformer)

    if (minProgress == null) {
        return true
    }

    return itemIsPlatformer ? progress <= minProgress : progress >= minProgress
}

function getListRecordBaseScore(list: { mode: string; isPlatformer: boolean }, item: any, record: { progress?: number | null }) {
    if (list.mode === 'top') {
        return 1
    }

    const rating = Number(item.rating ?? item.level?.rating ?? 0)

    if (!Number.isFinite(rating) || rating <= 0) {
        return 0
    }

    if (getItemIsPlatformer(item, list.isPlatformer)) {
        return rating
    }

    const progress = Math.max(0, Number(record.progress) || 0)

    return rating * (progress / 100)
}

async function enrichItemsWithViewerEligibleRecords(items: any[], list: { isPlatformer: boolean }, viewerId?: string) {
    if (!viewerId || !items.length) {
        return items
    }

    const levelIds = [...new Set(items.map((item) => item.levelId))]

    if (!levelIds.length) {
        return items
    }

    const { data, error } = await supabase
        .from('records')
        .select('levelid, progress, isChecked')
        .eq('userid', viewerId)
        .in('levelid', levelIds)

    if (error) {
        throw new Error(error.message)
    }

    const recordsByLevelId = new Map((data || []).map((record) => [record.levelid, record]))

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

async function getOfficialList(slug: OfficialListSlug, viewerId?: string) {
    const config = OFFICIAL_LISTS[slug]
    const levels = await config.loadLevels({ start: 0, end: 4999, uid: viewerId || '' })

    const list = {
        id: -1,
        slug: config.slug,
        owner: '',
        title: config.title,
        description: config.description,
        visibility: 'public',
        tags: ['official'],
        levelCount: levels.length,
        isPlatformer: config.isPlatformer,
        isOfficial: true,
        communityEnabled: false,
        mode: config.mode,
        weightFormula: '1',
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
            position: level.flTop ?? level.dlTop ?? index,
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
        updated_at: list.updated_at,
        starCount: 0,
        starred: false
    }
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

function assertOwner(list: CustomList, userId: string) {
    if (list.isOfficial) {
        throw new ForbiddenError('Official lists can only be managed by admins')
    }

    if (list.owner !== userId) {
        throw new ForbiddenError('You do not own this list')
    }
}

function assertReadable(list: CustomList, viewerId?: string) {
    if (list.visibility === 'private' && list.owner !== viewerId) {
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

async function getCustomListItems(listId: number, mode: string = 'rating') {
    const isTop = mode === 'top'

    const { data: items, error: itemsError } = await supabase
        .from('listLevels')
        .select('id, created_at, listId, levelId, addedBy, rating, position, minProgress')
        .eq('listId', listId)
        .order(isTop ? 'position' : 'rating', { ascending: isTop, nullsFirst: false })

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
        Object.keys(OFFICIAL_LISTS)
            .filter((slug): slug is OfficialListSlug => isOfficialListSlug(slug))
            .filter((slug) => !databaseOfficialSlugs.has(slug))
            .filter((slug) => {
                if (!normalizedSearch.length) {
                    return true
                }

                const entry = OFFICIAL_LISTS[slug]
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

export async function getCustomList(listId: CustomListIdentifier, viewerId?: string) {
    try {
        const resolved = await resolveCustomListIdentifier(listId)
        const list = await getListWithOwnerData(resolved.id)
        assertReadable(list, viewerId)

        const items = await enrichItemsWithViewerEligibleRecords(
            await getCustomListItems(list.id, list.mode),
            list,
            viewerId
        )
        const [{ starCount = 0, starred = false } = { starCount: 0, starred: false }] = await enrichListsWithStars([list], viewerId)

        return {
            ...list,
            starCount,
            starred,
            items
        }
    } catch (error) {
        if (error instanceof NotFoundError && typeof listId === 'string') {
            const normalizedIdentifier = listId.trim().toLowerCase()

            if (isOfficialListSlug(normalizedIdentifier)) {
                return getOfficialList(normalizedIdentifier, viewerId)
            }
        }

        throw error
    }
}

export async function getCustomListLeaderboard(identifier: CustomListIdentifier, options: {
    start?: number
    end?: number
    viewerId?: string
} = {}) {
    const {
        start = 0,
        end = 49,
        viewerId
    } = options

    const list = await getCustomList(identifier, viewerId)
    const items = list.items || []

    if (!items.length) {
        return {
            list,
            data: [],
            total: 0
        }
    }

    const levelIds = [...new Set(items.map((item: any) => item.levelId))]
    const itemByLevelId = new Map(items.map((item: any, index: number) => [item.levelId, { item, index }]))

    const { data, error } = await supabase
        .from('records')
        .select(`userid, levelid, progress, isChecked, timestamp, players!userid!inner(${playerSelect})`)
        .eq('isChecked', true)
        .eq('players.isHidden', false)
        .in('levelid', levelIds)

    if (error) {
        throw new Error(error.message)
    }

    const playerScores = new Map<string, {
        player: any
        score: number
        completedCount: number
        contributions: Map<number, number>
    }>()

    for (const record of (data || []) as any[]) {
        const itemData = itemByLevelId.get(record.levelid)

        if (!itemData) {
            continue
        }

        if (!isEligibleRecordForListItem(record, itemData.item, list.isPlatformer)) {
            continue
        }

        const contribution = getListRecordBaseScore(list, itemData.item, record)
            * evaluateWeightFormulaExpression(list.weightFormula || '1', {
                position: getNormalizedListPosition(itemData.item, itemData.index, list.id < 0),
                levelCount: items.length,
                rating: Number(itemData.item.rating ?? itemData.item.level?.rating ?? 0),
                minProgress: Number(getEffectiveMinProgress(itemData.item) ?? 0)
            })

        const existingPlayer = playerScores.get(record.userid)

        if (!existingPlayer) {
            playerScores.set(record.userid, {
                player: record.players,
                score: contribution,
                completedCount: 1,
                contributions: new Map([[record.levelid, contribution]])
            })
            continue
        }

        const previousContribution = existingPlayer.contributions.get(record.levelid)

        if (previousContribution != null) {
            existingPlayer.score -= previousContribution
        } else {
            existingPlayer.completedCount += 1
        }

        existingPlayer.score += contribution
        existingPlayer.contributions.set(record.levelid, contribution)
    }

    const ranked = [...playerScores.values()]
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
            score: Math.round(entry.score * 1000) / 1000,
            completedCount: entry.completedCount
        }))

    return {
        list,
        data: ranked.slice(start, end + 1),
        total: ranked.length
    }
}

export async function getRandomCustomListLevel(identifier: CustomListIdentifier, options: {
    excludeLevelIds?: number[]
    viewerId?: string
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

export async function updateCustomList(listId: number, ownerId: string, payload: {
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
    assertOwner(existing, ownerId)

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
        updates.visibility = sanitizeVisibility(payload.visibility)
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

export async function deleteCustomList(listId: number, ownerId: string) {
    const existing = await getCustomListRow(listId)
    assertOwner(existing, ownerId)

    const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId)

    if (error) {
        throw new Error(error.message)
    }
}

export async function addLevelToCustomList(listId: number, ownerId: string, levelId: number) {
    const list = await getCustomListRow(listId)
    assertOwner(list, ownerId)

    const level = await ensureLevelExists(levelId)
    assertLevelTypeMatchesList(list, level)

    const itemInsert: CustomListLevelInsert = {
        listId,
        levelId,
        addedBy: ownerId,
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

export async function removeLevelFromCustomList(listId: number, ownerId: string, levelId: number) {
    const list = await getCustomListRow(listId)
    assertOwner(list, ownerId)

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

export async function updateListLevel(listId: number, ownerId: string, levelId: number, patch: {
    rating?: unknown
    minProgress?: unknown
}) {
    const list = await getCustomListRow(listId)
    assertOwner(list, ownerId)

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

export async function reorderListLevels(listId: number, ownerId: string, levelIds: unknown) {
    const list = await getCustomListRow(listId)
    assertOwner(list, ownerId)

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