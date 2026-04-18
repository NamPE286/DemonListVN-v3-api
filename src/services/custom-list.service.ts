import supabase from '@src/client/supabase'
import { fetchLevelFromGD, getLevel, retrieveOrCreateLevel } from '@src/services/level.service'
import type { Tables, TablesInsert, TablesUpdate } from '@src/types/supabase'

type CustomList = Tables<'lists'>
type CustomListInsert = TablesInsert<'lists'>
type CustomListUpdate = TablesUpdate<'lists'>
type CustomListLevelInsert = TablesInsert<'listLevels'>

const VISIBILITY_VALUES = new Set(['private', 'unlisted', 'public'])
const MODE_VALUES = new Set(['rating', 'top'])

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

function assertOwner(list: CustomList, userId: string) {
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
        .select('*')
        .eq('owner', ownerId)
        .order('updated_at', { ascending: false })

    if (error) {
        throw new Error(error.message)
    }

    return data || []
}

export async function browseLists(options: {
    limit?: number
    offset?: number
    search?: string
}) {
    const {
        limit = 24,
        offset = 0,
        search = ''
    } = options

    let query = supabase
        .from('lists')
        .select('*', { count: 'exact' })
        .eq('visibility', 'public')

    if (search.trim().length) {
        const normalizedSearch = search.trim()
        query = query.or(`title.ilike.%${normalizedSearch}%,description.ilike.%${normalizedSearch}%`)
    }

    const { data, error, count } = await query
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (error) {
        throw new Error(error.message)
    }

    return {
        data: data || [],
        total: count || 0
    }
}

export async function getCustomList(listId: number, viewerId?: string) {
    const list = await getCustomListRow(listId)
    assertReadable(list, viewerId)

    const items = await getCustomListItems(listId, list.mode)

    return {
        ...list,
        items
    }
}

export async function createCustomList(ownerId: string, payload: {
    title: unknown
    description?: unknown
    visibility?: unknown
    tags?: unknown
    mode?: unknown
    isPlatformer?: unknown
}) {
    const listInsert: CustomListInsert = {
        owner: ownerId,
        title: sanitizeTitle(payload.title),
        description: sanitizeDescription(payload.description),
        visibility: sanitizeVisibility(payload.visibility),
        tags: sanitizeTags(payload.tags),
        mode: sanitizeMode(payload.mode),
        isPlatformer: sanitizeListPlatformer(payload.isPlatformer),
        updated_at: new Date().toISOString()
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

    const { error } = await supabase
        .from('lists')
        .update(updates)
        .eq('id', listId)

    if (error) {
        throw new Error(error.message)
    }

    return getCustomList(listId, ownerId)
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

    return getCustomList(listId, ownerId)
}