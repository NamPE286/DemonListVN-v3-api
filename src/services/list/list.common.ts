import supabase from '@src/client/supabase'
import {
    fetchAredlLevels,
    type AredlLevel
} from '@src/services/aredl.service'
import {
    fetchLevelFromGD,
    getChallengeListLevels,
    getDemonListLevels,
    getFeaturedListLevels,
    getLevel,
    getPlatformerListLevels,
    retrieveOrCreateLevel
} from '@src/services/level.service'
import { sendNotification } from '@src/services/notification.service'
import {
    fetchPointercrateListedDemonsPage,
    type PointercrateListedDemon
} from '@src/services/pointercrate.service'
import type { Json,Tables,TablesInsert,TablesUpdate } from '@src/types/supabase'
import { buildFullTextSearchParams,normalizeFullTextSearchQuery } from '@src/utils/full-text-search'
import getVideoId from 'get-video-id'
import {
    all,
    create
} from 'mathjs'

export {
buildFullTextSearchParams,
fetchAredlLevels,
fetchLevelFromGD,
fetchPointercrateListedDemonsPage,
getChallengeListLevels,
getDemonListLevels,
getFeaturedListLevels,
getLevel,
getPlatformerListLevels,
getVideoId,
normalizeFullTextSearchQuery,
retrieveOrCreateLevel,
sendNotification,
supabase
}

export type {
AredlLevel,
Json,
PointercrateListedDemon,
Tables,
TablesInsert,
TablesUpdate
}

export type CustomList = Tables<'lists'>
export type CustomListInsert = TablesInsert<'lists'>
export type CustomListUpdate = TablesUpdate<'lists'>
export type CustomListAuditLog = Tables<'listAuditLogs'>
export type CustomListAuditLogInsert = TablesInsert<'listAuditLogs'>
export type CustomListInvitation = Tables<'listInvitations'>
export type CustomListInvitationInsert = TablesInsert<'listInvitations'>
export type CustomListLevelRow = Tables<'listLevels'> & {
    accepted: boolean
    submissionComment?: string | null
}
export type CustomListLevelInsert = TablesInsert<'listLevels'> & {
    accepted?: boolean
    submissionComment?: string | null
}
export type CustomListMember = Tables<'listMembers'>
export type CustomListMemberInsert = TablesInsert<'listMembers'>
export type CustomListMemberUpdate = TablesUpdate<'listMembers'>
export type CustomListStarInsert = TablesInsert<'listStars'>
export type CustomListItemFilters = {
    topMin?: number | null
    topMax?: number | null
    ratingMin?: number | null
    ratingMax?: number | null
    nameSearch?: string | null
    creatorSearch?: string | null
    searchType?: string | null
    tagIds?: number[] | null
    ascending?: boolean | null
}
export type CustomListLeaderboardRefreshRow = {
    id: number
    listId: number
    totalPlayers: number
    totalRecords: number
    lastRefreshedAt: string
}

export type CustomListLeaderboardEntry = {
    uid: string
    rank: number
    score: number
    completedCount: number
}

export type CustomListLeaderboardRecordEntry = {
    uid: string
    levelId: number
    point: number
    no: number
}

export type CustomListLeaderboardRecordEntryReference = Pick<CustomListLeaderboardRecordEntry, 'point' | 'no'>

export type PlayerRankedListSummary = {
    id: number
    slug: string | null
    identifier: string
    title: string
    isOfficial: boolean
    isVerified: boolean
    mode: string
    isPlatformer: boolean
    rank: number
    score: number
    completedCount: number
    lastRefreshedAt: string | null
    rankBadges: CustomListRankBadge[]
}

export type CustomListRecordPlatformFilter = 'any' | 'pc' | 'mobile'
export type CustomListRecordAcceptanceFilter = 'manual' | 'auto' | 'any'

export type CustomListRecordFilterSettings = Pick<
    CustomList,
    'recordFilterPlatform'
    | 'recordFilterMinRefreshRate'
    | 'recordFilterMaxRefreshRate'
    | 'recordFilterManualAcceptanceOnly'
    | 'recordFilterAcceptanceStatus'
>

export type CustomListRankBadge = {
    name: string
    shorthand: string
    color: string
    minRating: number | null
    minTop: number | null
}

export type CustomListMemberRole = 'admin' | 'helper'

export type CustomListResolvedRole = 'viewer' | 'owner' | 'admin' | 'helper' | 'moderator'

export type CustomListPermissions = {
    canEditSettings: boolean
    canEditLevels: boolean
    canReviewSubmissions: boolean
    canDelete: boolean
    canBan: boolean
    canManageMembers: boolean
    canConfigureCollaboration: boolean
    canTransferOwnership: boolean
    canViewMembers: boolean
    canViewAudit: boolean
    canViewPendingInvitations: boolean
    canRespondToInvitation: boolean
}

export type CustomListAccessContext = {
    actorUid: string | null
    isModerator: boolean
    isOwner: boolean
    memberRole: CustomListMemberRole | null
    pendingInvitation: CustomListInvitation | null
}

export type CustomListMemberWithPlayerData = CustomListMember & {
    playerData?: any
}

export type CustomListInvitationWithPlayerData = CustomListInvitation & {
    playerData?: any
    invitedByData?: any
}

export type CustomListAuditLogWithPlayerData = CustomListAuditLog & {
    actorData?: any
    targetData?: any
}

export type CustomListActor = string | {
    uid: string
    isAdmin?: boolean | null
    isManager?: boolean | null
} | undefined

export type BatchCustomListLevelInput = {
    levelId: number
    createdAt?: string
}

export type CustomListSettingsPayload = {
    title?: unknown
    description?: unknown
    backgroundColor?: unknown
    bannerUrl?: unknown
    borderColor?: unknown
    visibility?: unknown
    tags?: unknown
    mode?: unknown
    isPlatformer?: unknown
    communityEnabled?: unknown
    leaderboardEnabled?: unknown
    faviconUrl?: unknown
    logoUrl?: unknown
    topEnabled?: unknown
    levelSubmissionEnabled?: unknown
    staffListEnabled?: unknown
    slug?: unknown
    weightFormula?: unknown
    recordScoreFormula?: unknown
    rankBadges?: unknown
    itemSort?: unknown
    recordFilterPlatform?: unknown
    recordFilterMinRefreshRate?: unknown
    recordFilterMaxRefreshRate?: unknown
    recordFilterManualAcceptanceOnly?: unknown
    recordFilterAcceptanceStatus?: unknown
}

export const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

export type CustomListWithOwnerData = CustomList & {
    ownerData?: any
    currentUserRole?: CustomListResolvedRole
    permissions?: CustomListPermissions
    members?: CustomListMemberWithPlayerData[]
    pendingInvitations?: CustomListInvitationWithPlayerData[]
    pendingInvitation?: CustomListInvitationWithPlayerData | null
    auditLog?: CustomListAuditLogWithPlayerData[]
}

export type CustomListSubmission = CustomListLevelRow & {
    level?: any
    submitterData?: any
}

export const VISIBILITY_VALUES = new Set(['private', 'unlisted', 'public'])
export const MODE_VALUES = new Set(['rating', 'top'])
export const CUSTOM_LIST_ITEM_SORT_VALUES = new Set(['mode_default', 'created_at'])
export const CUSTOM_LIST_RECORD_PLATFORM_VALUES = new Set<CustomListRecordPlatformFilter>(['any', 'pc', 'mobile'])
export const CUSTOM_LIST_RECORD_ACCEPTANCE_VALUES = new Set<CustomListRecordAcceptanceFilter>(['manual', 'auto', 'any'])
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/
export const WEIGHT_FORMULA_VALIDATION_SCOPE = {
    score: 1,
    position: 1,
    levelCount: 1,
    top: 1,
    rating: 1,
    time: 0,
    baseTime: 0,
    minProgress: 0,
    progress: 0
}
export const RECORD_SCORE_FORMULA_VALIDATION_SCOPE = {
    levelCount: 1,
    top: 1,
    rating: 1,
    time: 0,
    baseTime: 0,
    minProgress: 0,
    progress: 0
}
export const OFFICIAL_LIST_SLUGS = ['dl', 'pl', 'fl', 'cl'] as const
export const CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE = 1000
export const CUSTOM_LIST_ITEMS_SELECT_PAGE_SIZE = 1000
export const CUSTOM_LIST_LEADERBOARD_PLAYER_BATCH_SIZE = 500
export const CUSTOM_LIST_RANK_BADGE_LIMIT = 20
export const CUSTOM_LIST_AUDIT_LOG_LIMIT = 50
export const CUSTOM_LIST_MEMBER_ROLE_VALUES = new Set<CustomListMemberRole>(['admin', 'helper'])
export const POINTERCRATE_MIRROR_LIST_ID = 109
export const POINTERCRATE_MIRROR_CRAWL_MAX_PAGE_LIMIT = 100
export const POINTERCRATE_MIRROR_CRAWL_MAX_PAGES = 100
export const AREDL_MIRROR_LIST_ID = 114
export const MIRROR_LEVELS_UPSERT_BATCH_SIZE = 50
export const MIRROR_LEVELS_SELECT_PAGE_SIZE = 1000

export function buildCustomListInvitationRedirect(list: Pick<CustomList, 'id' | 'slug'>) {
    return `/lists/${list.slug || list.id}/collaborator-invitation`
}

export function buildCustomListInvitationRejectRedirect(list: Pick<CustomList, 'id' | 'slug' | 'visibility'>) {
    if (list.visibility === 'private') {
        return '/lists'
    }

    return `/lists/${list.slug || list.id}`
}

export type CustomListIdentifier = number | string

export type OfficialListSlug = (typeof OFFICIAL_LIST_SLUGS)[number]

export function getOfficialListConfig(slug: OfficialListSlug) {
    switch (slug) {
        case 'dl':
            return {
                slug: 'dl',
                title: 'Classic List',
                description: 'Official Geometry Dash Việt Nam classic demon list.',
                mode: 'rating' as const,
                isPlatformer: false,
                recordScoreFormula: 'rating',
                weightFormula: 'score*(max(0,1-abs(position-1))/3+max(0,1-abs(position-2))/5+2*max(0,1-abs(position-3))/15)+(score == 0 ? 0 : 10*min(1,max(0,position-3))*min(1,max(0,26-position))/3+2*min(1,max(0,position-25))/3)',
                loadLevels: getDemonListLevels
            }
        case 'pl':
            return {
                slug: 'pl',
                title: 'Platformer List',
                description: 'Official Geometry Dash Việt Nam platformer list.',
                mode: 'top' as const,
                isPlatformer: true,
                recordScoreFormula: 'levelCount - top + 1',
                weightFormula: 'score == 0 ? 0 : 1',
                loadLevels: getPlatformerListLevels
            }
        case 'fl':
            return {
                slug: 'fl',
                title: 'Featured List',
                description: 'Official Geometry Dash Việt Nam featured list.',
                mode: 'top' as const,
                isPlatformer: false,
                recordScoreFormula: 'levelCount - top + 1',
                weightFormula: 'score == 0 ? 0 : 1',
                loadLevels: getFeaturedListLevels
            }
        case 'cl':
            return {
                slug: 'cl',
                title: 'Challenge List',
                description: 'Official Geometry Dash Việt Nam challenge list.',
                mode: 'rating' as const,
                isPlatformer: false,
                recordScoreFormula: 'rating',
                weightFormula: 'score*max(0,ceil(-pow((position-42.21)/10,3)+30)/100)/12',
                loadLevels: getChallengeListLevels
            }
    }
}

export function isOfficialListSlug(value: string): value is OfficialListSlug {
    return (OFFICIAL_LIST_SLUGS as readonly string[]).includes(value)
}

export async function getLatestCustomListLeaderboardRefresh(listId: number) {
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

export const CUSTOM_LIST_FORMULA_DISABLED_FUNCTIONS = [
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

export const customListFormulaMath = create(all)
export const parseCustomListFormulaNode = customListFormulaMath.parse.bind(customListFormulaMath)

customListFormulaMath.import(
    Object.fromEntries(
        CUSTOM_LIST_FORMULA_DISABLED_FUNCTIONS.map((functionName) => [
            functionName,
            () => {
                throw new ValidationError(`Formula function "${functionName}" is disabled`)
            }
        ])
    ),
    { override: true }
)

export function getCustomListFormulaNodeType(node: any) {
    if (typeof node?.type === 'string') {
        return node.type
    }

    if (typeof node?.mathjs === 'string') {
        return node.mathjs
    }

    return null
}

export function assertCustomListFormulaNodeIsSafe(node: any, formulaName: string) {
    node.traverse((child: any) => {
        if (getCustomListFormulaNodeType(child) === 'FunctionAssignmentNode') {
            throw new ValidationError(`${formulaName} custom functions are disabled`)
        }
    })
}

export function validateCustomListFormulaExpression(value: string, formulaName: string) {
    try {
        const node = parseCustomListFormulaNode(value)
        assertCustomListFormulaNodeIsSafe(node, formulaName)
        return node
    } catch (error) {
        if (error instanceof ValidationError) {
            throw error
        }

        throw new ValidationError(`${formulaName} must be a valid math expression`)
    }
}

export function normalizeCustomListFormulaResult(result: unknown, formulaName: string): number {
    if (result && typeof result === 'object' && Array.isArray((result as { entries?: unknown[] }).entries)) {
        const entries = (result as { entries: unknown[] }).entries

        for (let index = entries.length - 1; index >= 0; index -= 1) {
            if (entries[index] !== undefined) {
                return normalizeCustomListFormulaResult(entries[index], formulaName)
            }
        }
    }

    if (typeof result === 'boolean' || typeof result === 'string' || Array.isArray(result) || result == null) {
        throw new ValidationError(`${formulaName} must evaluate to a finite number`)
    }

    const normalized = typeof result === 'number' ? result : Number(result)

    if (!Number.isFinite(normalized)) {
        throw new ValidationError(`${formulaName} must evaluate to a finite number`)
    }

    return normalized
}

export function evaluateCustomListFormulaExpression(value: string, scope: Record<string, number>, formulaName: string) {
    const node = validateCustomListFormulaExpression(value, formulaName)
    try {
        return normalizeCustomListFormulaResult(node.compile().evaluate({ ...scope }), formulaName)
    } catch (error) {
        if (error instanceof ValidationError) {
            throw error
        }

        throw new ValidationError(error instanceof Error ? error.message : `${formulaName} must evaluate to a finite number`)
    }
}

export function evaluateWeightFormulaExpression(value: string, scope: {
    score: number
    position: number
    levelCount: number
    top: number
    rating: number
    time: number
    baseTime: number
    minProgress: number
    progress: number
}) {
    return evaluateCustomListFormulaExpression(value, scope, 'weightFormula')
}

export function evaluateRecordScoreFormulaExpression(value: string, scope: {
    levelCount: number
    top: number
    rating: number
    time: number
    baseTime: number
    minProgress: number
    progress: number
}) {
    return evaluateCustomListFormulaExpression(value, scope, 'recordScoreFormula')
}

export async function ensureUniqueListSlug(slug: string, excludeListId?: number) {
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

export function requireListId(value: number) {
    if (!Number.isInteger(value) || value <= 0) {
        throw new ValidationError('Invalid list ID')
    }
}

export function requireLevelId(value: number) {
    if (!Number.isInteger(value) || value <= 0) {
        throw new ValidationError('Invalid level ID')
    }
}

export function sanitizeTitle(value: unknown) {
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

export function sanitizeSlug(value: unknown) {
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

export function sanitizeDescription(value: unknown) {
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

export function sanitizeThemeColor(value: unknown, fieldName: string) {
    if (value == null || value === '') {
        return null
    }

    if (typeof value !== 'string') {
        throw new ValidationError(`${fieldName} must be a string`)
    }

    const color = value.trim()

    if (!HEX_COLOR_PATTERN.test(color)) {
        throw new ValidationError(`${fieldName} must be a valid hex color`)
    }

    return color.toLowerCase()
}

export function sanitizeThemeUrl(value: unknown, fieldName: string) {
    if (value == null || value === '') {
        return null
    }

    if (typeof value !== 'string') {
        throw new ValidationError(`${fieldName} must be a string`)
    }

    const url = value.trim()

    if (!url.length) {
        return null
    }

    if (url.length > 500) {
        throw new ValidationError(`${fieldName} must be at most 500 characters`)
    }

    let parsed: URL

    try {
        parsed = new URL(url)
    } catch {
        throw new ValidationError(`${fieldName} must be a valid URL`)
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new ValidationError(`${fieldName} must use http or https`)
    }

    return parsed.toString()
}

export function sanitizeVisibility(value: unknown) {
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

export function sanitizeMode(value: unknown) {
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

export function sanitizeListPlatformer(value: unknown) {
    if (value == null) {
        return false
    }

    if (typeof value !== 'boolean') {
        throw new ValidationError('isPlatformer must be a boolean')
    }

    return value
}

export function sanitizeCommunityEnabled(value: unknown) {
    if (value == null) {
        return true
    }

    if (typeof value !== 'boolean') {
        throw new ValidationError('communityEnabled must be a boolean')
    }

    return value
}

export function sanitizeTopEnabled(value: unknown) {
    if (value == null) {
        return true
    }

    if (typeof value !== 'boolean') {
        throw new ValidationError('topEnabled must be a boolean')
    }

    return value
}

export function sanitizeLeaderboardEnabled(value: unknown) {
    if (value == null) {
        return true
    }

    if (typeof value !== 'boolean') {
        throw new ValidationError('leaderboardEnabled must be a boolean')
    }

    return value
}

export function sanitizeLevelSubmissionEnabled(value: unknown) {
    if (value == null) {
        return false
    }

    if (typeof value !== 'boolean') {
        throw new ValidationError('levelSubmissionEnabled must be a boolean')
    }

    return value
}

export function sanitizeStaffListEnabled(value: unknown) {
    if (value == null) {
        return true
    }

    if (typeof value !== 'boolean') {
        throw new ValidationError('staffListEnabled must be a boolean')
    }

    return value
}

export function sanitizeCustomListItemSort(value: unknown) {
    if (value == null) {
        return 'mode_default'
    }

    if (typeof value !== 'string') {
        throw new ValidationError('itemSort must be a string')
    }

    const itemSort = value.trim().toLowerCase()

    if (!CUSTOM_LIST_ITEM_SORT_VALUES.has(itemSort)) {
        throw new ValidationError('itemSort must be mode_default or created_at')
    }

    return itemSort as 'mode_default' | 'created_at'
}

export function sanitizeCustomListRecordPlatform(value: unknown): CustomListRecordPlatformFilter {
    if (value == null) {
        return 'any'
    }

    if (typeof value !== 'string') {
        throw new ValidationError('recordFilterPlatform must be a string')
    }

    const platform = value.trim().toLowerCase()

    if (!CUSTOM_LIST_RECORD_PLATFORM_VALUES.has(platform as CustomListRecordPlatformFilter)) {
        throw new ValidationError('recordFilterPlatform must be any, pc, or mobile')
    }

    return platform as CustomListRecordPlatformFilter
}

export function sanitizeCustomListRecordRefreshRate(value: unknown, label: 'recordFilterMinRefreshRate' | 'recordFilterMaxRefreshRate') {
    if (value == null || value === '') {
        return null
    }

    const refreshRate = Number(value)

    if (!Number.isInteger(refreshRate) || refreshRate < 1) {
        throw new ValidationError(`${label} must be a positive integer`)
    }

    return refreshRate
}

export function sanitizeCustomListManualAcceptanceOnly(value: unknown) {
    if (value == null) {
        return true
    }

    if (typeof value !== 'boolean') {
        throw new ValidationError('recordFilterManualAcceptanceOnly must be a boolean')
    }

    return value
}

export function sanitizeCustomListRecordAcceptanceStatus(value: unknown): CustomListRecordAcceptanceFilter {
    if (value == null) {
        return 'manual'
    }

    if (typeof value !== 'string') {
        throw new ValidationError('recordFilterAcceptanceStatus must be a string')
    }

    const status = value.trim().toLowerCase()

    if (!CUSTOM_LIST_RECORD_ACCEPTANCE_VALUES.has(status as CustomListRecordAcceptanceFilter)) {
        throw new ValidationError('recordFilterAcceptanceStatus must be manual, auto, or any')
    }

    return status as CustomListRecordAcceptanceFilter
}

export function sanitizeListLevelCreatedAt(value: unknown) {
    if (typeof value !== 'string') {
        throw new ValidationError('createdAt must be a string')
    }

    const createdAt = value.trim()

    if (!createdAt.length) {
        throw new ValidationError('createdAt is required')
    }

    const parsed = new Date(createdAt)

    if (Number.isNaN(parsed.getTime())) {
        throw new ValidationError('createdAt must be a valid date')
    }

    return parsed.toISOString()
}

export function sanitizeBatchCustomListLevelInputs(value: unknown) {
    if (!Array.isArray(value)) {
        throw new ValidationError('levelInputs must be an array')
    }

    const levelInputs: BatchCustomListLevelInput[] = []
    const seenLevelIds = new Set<number>()

    for (const entry of value) {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
            throw new ValidationError('Each level input must be an object')
        }

        const rawEntry = entry as {
            levelId?: unknown
            createdAt?: unknown
            created_at?: unknown
        }
        const levelId = Number.parseInt(String(rawEntry.levelId ?? ''), 10)

        requireLevelId(levelId)

        if (seenLevelIds.has(levelId)) {
            continue
        }

        seenLevelIds.add(levelId)

        const levelInput: BatchCustomListLevelInput = { levelId }
        const rawCreatedAt = rawEntry.createdAt ?? rawEntry.created_at

        if (rawCreatedAt !== undefined) {
            levelInput.createdAt = sanitizeListLevelCreatedAt(rawCreatedAt)
        }

        levelInputs.push(levelInput)
    }

    return levelInputs
}

export function sanitizeLevelReorderIds(value: unknown) {
    if (!Array.isArray(value) || !value.every((id) => Number.isInteger(id) && id > 0)) {
        throw new ValidationError('levelIds must be an array of positive integers')
    }

    return value as number[]
}

export function sanitizeOfficial(value: unknown) {
    if (value == null) {
        return false
    }

    if (typeof value !== 'boolean') {
        throw new ValidationError('isOfficial must be a boolean')
    }

    return value
}

export function sanitizeListBanState(value: unknown) {
    if (typeof value !== 'boolean') {
        throw new ValidationError('isBanned must be a boolean')
    }

    return value
}

export function sanitizeCustomListFormula(
    value: unknown,
    formulaName: 'weightFormula' | 'recordScoreFormula',
    fallback: string,
    validationScope: Record<string, number>
) {
    if (value == null) {
        return fallback
    }

    if (typeof value !== 'string') {
        throw new ValidationError(`${formulaName} must be a string`)
    }

    const formula = value.trim()

    if (!formula.length) {
        throw new ValidationError(`${formulaName} is required`)
    }

    if (formula.length > 500) {
        throw new ValidationError(`${formulaName} must be at most 500 characters`)
    }

    evaluateCustomListFormulaExpression(formula, validationScope, formulaName)

    return formula
}

export function sanitizeWeightFormula(value: unknown) {
    return sanitizeCustomListFormula(value, 'weightFormula', '1', WEIGHT_FORMULA_VALIDATION_SCOPE)
}

export function sanitizeRecordScoreFormula(value: unknown) {
    return sanitizeCustomListFormula(value, 'recordScoreFormula', '1', RECORD_SCORE_FORMULA_VALIDATION_SCOPE)
}

export function sanitizeRankBadgeName(value: unknown) {
    if (typeof value !== 'string') {
        throw new ValidationError('Rank badge name must be a string')
    }

    const name = value.trim()

    if (!name.length) {
        throw new ValidationError('Rank badge name is required')
    }

    if (name.length > 30) {
        throw new ValidationError('Rank badge name must be at most 30 characters')
    }

    return name
}

export function sanitizeRankBadgeShorthand(value: unknown, fallback: string) {
    if (value == null || value === '') {
        return fallback
    }

    if (typeof value !== 'string') {
        throw new ValidationError('Rank badge shorthand must be a string')
    }

    const shorthand = value.trim()

    if (!shorthand.length) {
        return fallback
    }

    if (shorthand.length > 20) {
        throw new ValidationError('Rank badge shorthand must be at most 20 characters')
    }

    return shorthand
}

export function sanitizeRankBadgeColor(value: unknown) {
    if (typeof value !== 'string') {
        throw new ValidationError('Rank badge color must be a string')
    }

    const color = value.trim()

    if (!color.length) {
        throw new ValidationError('Rank badge color is required')
    }

    if (color.length > 120) {
        throw new ValidationError('Rank badge color must be at most 120 characters')
    }

    return color
}

export function sanitizeRankBadgeMinRating(value: unknown) {
    if (value == null || value === '') {
        return null
    }

    const rating = Number(value)

    if (!Number.isFinite(rating) || rating < 0) {
        throw new ValidationError('Rank badge minimum rating must be 0 or greater')
    }

    return rating
}

export function sanitizeRankBadgeMinTop(value: unknown) {
    if (value == null || value === '') {
        return null
    }

    const top = Number(value)

    if (!Number.isInteger(top) || top < 1) {
        throw new ValidationError('Rank badge minimum top must be a positive integer')
    }

    return top
}

export function sanitizeRankBadges(value: unknown): CustomListRankBadge[] {
    if (value == null) {
        return []
    }

    if (!Array.isArray(value)) {
        throw new ValidationError('rankBadges must be an array')
    }

    if (value.length > CUSTOM_LIST_RANK_BADGE_LIMIT) {
        throw new ValidationError(`rankBadges can contain at most ${CUSTOM_LIST_RANK_BADGE_LIMIT} badges`)
    }

    return value.map((entry) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
            throw new ValidationError('Each rank badge must be an object')
        }

        const badge = entry as {
            name?: unknown
            shorthand?: unknown
            color?: unknown
            minRating?: unknown
            minTop?: unknown
        }

        const name = sanitizeRankBadgeName(badge.name)

        const minRating = sanitizeRankBadgeMinRating(badge.minRating)
        const minTop = sanitizeRankBadgeMinTop(badge.minTop)

        if (minRating == null && minTop == null) {
            throw new ValidationError('Each rank badge must define a minimum rating, a minimum top, or both')
        }

        return {
            name,
            shorthand: sanitizeRankBadgeShorthand(badge.shorthand, name),
            color: sanitizeRankBadgeColor(badge.color),
            minRating,
            minTop
        }
    })
}

export function normalizeRankBadges(value: unknown): CustomListRankBadge[] {
    try {
        return sanitizeRankBadges(value)
    } catch {
        return []
    }
}

export function getCustomListRecordPlatform(list: Pick<CustomList, 'recordFilterPlatform'>) {
    return CUSTOM_LIST_RECORD_PLATFORM_VALUES.has(list.recordFilterPlatform as CustomListRecordPlatformFilter)
        ? list.recordFilterPlatform as CustomListRecordPlatformFilter
        : 'any'
}

export function getCustomListRecordMinRefreshRate(list: Pick<CustomList, 'recordFilterMinRefreshRate'>) {
    return Number.isInteger(list.recordFilterMinRefreshRate) && Number(list.recordFilterMinRefreshRate) > 0
        ? Number(list.recordFilterMinRefreshRate)
        : null
}

export function getCustomListRecordMaxRefreshRate(list: Pick<CustomList, 'recordFilterMaxRefreshRate'>) {
    return Number.isInteger(list.recordFilterMaxRefreshRate) && Number(list.recordFilterMaxRefreshRate) > 0
        ? Number(list.recordFilterMaxRefreshRate)
        : null
}

export function getCustomListRecordAcceptanceStatus(list: Pick<CustomList, 'recordFilterAcceptanceStatus' | 'recordFilterManualAcceptanceOnly'>): CustomListRecordAcceptanceFilter {
    const status = list.recordFilterAcceptanceStatus

    if (CUSTOM_LIST_RECORD_ACCEPTANCE_VALUES.has(status as CustomListRecordAcceptanceFilter)) {
        return status as CustomListRecordAcceptanceFilter
    }

    return (list.recordFilterManualAcceptanceOnly ?? true) ? 'manual' : 'any'
}

export function getManualAcceptanceOnlyForStatus(status: CustomListRecordAcceptanceFilter) {
    return status === 'manual'
}

export function isCustomListRecordAccepted(record: {
    acceptedManually?: boolean | null
    acceptedAuto?: boolean | null
}, list: Pick<CustomList, 'recordFilterAcceptanceStatus' | 'recordFilterManualAcceptanceOnly'>) {
    const status = getCustomListRecordAcceptanceStatus(list)

    if (status === 'manual') {
        return Boolean(record.acceptedManually)
    }

    if (status === 'auto') {
        return !record.acceptedManually && Boolean(record.acceptedAuto)
    }

    return Boolean(record.acceptedManually) || Boolean(record.acceptedAuto)
}

export function isCustomListRecordEligibleForFilters(record: {
    acceptedManually?: boolean | null
    acceptedAuto?: boolean | null
    mobile?: boolean | null
    refreshRate?: number | null
}, list: CustomListRecordFilterSettings) {
    if (!isCustomListRecordAccepted(record, list)) {
        return false
    }

    const platform = getCustomListRecordPlatform(list)

    if (platform === 'mobile' && !record.mobile) {
        return false
    }

    if (platform === 'pc' && record.mobile) {
        return false
    }

    const minRefreshRate = getCustomListRecordMinRefreshRate(list)
    const maxRefreshRate = getCustomListRecordMaxRefreshRate(list)

    if (minRefreshRate == null && maxRefreshRate == null) {
        return true
    }

    const refreshRate = Number(record.refreshRate)

    if (!Number.isFinite(refreshRate)) {
        return false
    }

    if (minRefreshRate != null && refreshRate < minRefreshRate) {
        return false
    }

    if (maxRefreshRate != null && refreshRate > maxRefreshRate) {
        return false
    }

    return true
}

export function applyCustomListRecordFiltersToQuery(
    query: any,
    list: CustomListRecordFilterSettings
) {
    let nextQuery = query
    const acceptanceStatus = getCustomListRecordAcceptanceStatus(list)

    if (acceptanceStatus === 'manual') {
        nextQuery = nextQuery.eq('acceptedManually', true)
    } else if (acceptanceStatus === 'auto') {
        nextQuery = nextQuery.eq('acceptedAuto', true).or('acceptedManually.eq.false,acceptedManually.is.null')
    } else {
        nextQuery = nextQuery.or('acceptedManually.eq.true,acceptedAuto.eq.true')
    }

    const platform = getCustomListRecordPlatform(list)

    if (platform === 'mobile') {
        nextQuery = nextQuery.eq('mobile', true)
    } else if (platform === 'pc') {
        nextQuery = nextQuery.or('mobile.eq.false,mobile.is.null')
    }

    const minRefreshRate = getCustomListRecordMinRefreshRate(list)
    const maxRefreshRate = getCustomListRecordMaxRefreshRate(list)

    if (minRefreshRate != null) {
        nextQuery = nextQuery.gte('refreshRate', minRefreshRate)
    }

    if (maxRefreshRate != null) {
        nextQuery = nextQuery.lte('refreshRate', maxRefreshRate)
    }

    return nextQuery
}

export function sanitizeRating(value: unknown) {
    const n = Number(value)
    if (!Number.isFinite(n) || n < 0) {
        throw new ValidationError('Rating must be a number greater than or equal to 0')
    }
    return n
}

export function sanitizeMinProgress(value: unknown, isPlatformer: boolean) {
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

export function sanitizeCustomListVideoId(value: unknown) {
    if (value == null || value === '') {
        return null
    }

    if (typeof value !== 'string') {
        throw new ValidationError('Video ID must be a string')
    }

    const trimmed = value.trim()

    if (!trimmed.length) {
        return null
    }

    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
        return trimmed
    }

    const parsedVideo = getVideoId(trimmed)

    if (parsedVideo?.id) {
        return parsedVideo.id
    }

    throw new ValidationError('Video ID must be a valid YouTube video ID or URL')
}

export function sanitizeTags(value: unknown) {
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

export async function getCustomListRow(listId: number) {
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

export async function getCustomListBySlug(slug: string) {
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

export function sanitizeActorUid(value: unknown, label: string) {
    if (typeof value !== 'string' || !value.trim().length) {
        throw new ValidationError(`Invalid ${label}`)
    }

    return value.trim()
}

export function sanitizeCustomListMemberRole(value: unknown): CustomListMemberRole {
    if (typeof value !== 'string') {
        throw new ValidationError('role must be either "admin" or "helper"')
    }

    const normalized = value.trim().toLowerCase()

    if (!CUSTOM_LIST_MEMBER_ROLE_VALUES.has(normalized as CustomListMemberRole)) {
        throw new ValidationError('role must be either "admin" or "helper"')
    }

    return normalized as CustomListMemberRole
}

export function sanitizeAdminsCanManageHelpers(value: unknown) {
    if (typeof value !== 'boolean') {
        throw new ValidationError('adminsCanManageHelpers must be a boolean')
    }

    return value
}

export async function getPlayersByUid(uids: string[]) {
    const uniqueUids = [...new Set(uids.filter(Boolean))]

    if (!uniqueUids.length) {
        return new Map<string, any>()
    }

    const { data, error } = await supabase
        .from('players')
        .select(playerSelect)
        .in('uid', uniqueUids)

    if (error) {
        throw new Error(error.message)
    }

    return new Map<string, any>(((data || []) as any[]).map((player) => [player.uid, player]))
}

export async function ensurePlayerExists(uid: string) {
    const players = await getPlayersByUid([uid])
    const player = players.get(uid)

    if (!player) {
        throw new NotFoundError('Player not found')
    }

    return player
}

export async function getCustomListMembership(listId: number, uid?: string | null) {
    if (!uid) {
        return null
    }

    const { data, error } = await supabase
        .from('listMembers')
        .select('*')
        .eq('listId', listId)
        .eq('uid', uid)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    return (data || null) as CustomListMember | null
}

export async function getCustomListInvitation(listId: number, uid?: string | null) {
    if (!uid) {
        return null
    }

    const { data, error } = await supabase
        .from('listInvitations')
        .select('*')
        .eq('listId', listId)
        .eq('uid', uid)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    return (data || null) as CustomListInvitation | null
}

export async function hydrateCustomListInvitation(invitation: CustomListInvitation | null) {
    if (!invitation) {
        return null
    }

    const playersByUid = await getPlayersByUid([invitation.uid, invitation.invitedBy])

    return {
        ...invitation,
        playerData: playersByUid.get(invitation.uid) || null,
        invitedByData: playersByUid.get(invitation.invitedBy) || null
    } satisfies CustomListInvitationWithPlayerData
}

export async function getCustomListInvitations(listId: number) {
    const { data, error } = await supabase
        .from('listInvitations')
        .select('*')
        .eq('listId', listId)
        .order('created_at', { ascending: true })

    if (error) {
        throw new Error(error.message)
    }

    const invitations = (data || []) as CustomListInvitation[]

    if (!invitations.length) {
        return [] as CustomListInvitationWithPlayerData[]
    }

    const playersByUid = await getPlayersByUid(
        invitations.flatMap((invitation) => [invitation.uid, invitation.invitedBy])
    )

    return invitations.map((invitation) => ({
        ...invitation,
        playerData: playersByUid.get(invitation.uid) || null,
        invitedByData: playersByUid.get(invitation.invitedBy) || null
    }))
}

export async function deleteCustomListInvitation(listId: number, uid: string) {
    const { error } = await supabase
        .from('listInvitations')
        .delete()
        .eq('listId', listId)
        .eq('uid', uid)

    if (error) {
        throw new Error(error.message)
    }
}

export async function getCustomListMembers(listId: number) {
    const { data, error } = await supabase
        .from('listMembers')
        .select('*')
        .eq('listId', listId)
        .order('role', { ascending: true })
        .order('created_at', { ascending: true })

    if (error) {
        throw new Error(error.message)
    }

    const members = (data || []) as CustomListMember[]

    if (!members.length) {
        return [] as CustomListMemberWithPlayerData[]
    }

    const playersByUid = await getPlayersByUid(members.map((member) => member.uid))

    return members.map((member) => ({
        ...member,
        playerData: playersByUid.get(member.uid) || null
    }))
}

export async function getCustomListAuditLog(listId: number, limit: number = CUSTOM_LIST_AUDIT_LOG_LIMIT) {
    const { data, error } = await supabase
        .from('listAuditLogs')
        .select('*')
        .eq('listId', listId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        throw new Error(error.message)
    }

    const entries = (data || []) as CustomListAuditLog[]

    if (!entries.length) {
        return [] as CustomListAuditLogWithPlayerData[]
    }

    const playersByUid = await getPlayersByUid(
        entries
            .flatMap((entry) => [entry.actorUid, entry.targetUid])
            .filter((uid): uid is string => Boolean(uid))
    )

    return entries.map((entry) => ({
        ...entry,
        actorData: entry.actorUid ? playersByUid.get(entry.actorUid) || null : null,
        targetData: entry.targetUid ? playersByUid.get(entry.targetUid) || null : null
    }))
}

export async function appendCustomListAuditLog(listId: number, entry: {
    actorUid?: string | null
    action: string
    targetUid?: string | null
    metadata?: Record<string, unknown>
}) {
    const insert: CustomListAuditLogInsert = {
        listId,
        actorUid: entry.actorUid ?? null,
        action: entry.action,
        targetUid: entry.targetUid ?? null,
        metadata: (entry.metadata || {}) as any
    }

    const { error } = await supabase
        .from('listAuditLogs')
        .insert(insert)

    if (error) {
        console.error('Failed to append custom list audit log', {
            listId,
            action: entry.action,
            error: error.message
        })
    }
}

export function normalizeCustomListAuditValue(value: unknown): unknown {
    if (value == null) {
        return null
    }

    if (Array.isArray(value)) {
        return value.map((entry) => normalizeCustomListAuditValue(entry))
    }

    if (typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
                .sort(([left], [right]) => left.localeCompare(right))
                .map(([key, entryValue]) => [key, normalizeCustomListAuditValue(entryValue)])
        )
    }

    return value
}

export function areCustomListValuesEqual(left: unknown, right: unknown) {
    return JSON.stringify(normalizeCustomListAuditValue(left)) === JSON.stringify(normalizeCustomListAuditValue(right))
}
