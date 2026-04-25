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
import { sendNotification } from '@src/services/notification.service'
import {
    fetchPointercrateListedDemonsPage,
    normalizePointercrateListedDemonsLimit,
    type PointercrateListedDemon
} from '@src/services/pointercrate.service'
import getVideoId from 'get-video-id'
import type { Tables, TablesInsert, TablesUpdate } from '@src/types/supabase'
import { buildFullTextSearchParams, normalizeFullTextSearchQuery } from '@src/utils/full-text-search'

type CustomList = Tables<'lists'>
type CustomListInsert = TablesInsert<'lists'>
type CustomListUpdate = TablesUpdate<'lists'>
type CustomListAuditLog = Tables<'listAuditLogs'>
type CustomListAuditLogInsert = TablesInsert<'listAuditLogs'>
type CustomListInvitation = Tables<'listInvitations'>
type CustomListInvitationInsert = TablesInsert<'listInvitations'>
type CustomListLevelRow = Tables<'listLevels'> & {
    accepted: boolean
    submissionComment?: string | null
}
type CustomListLevelInsert = TablesInsert<'listLevels'> & {
    accepted?: boolean
    submissionComment?: string | null
}
type CustomListMember = Tables<'listMembers'>
type CustomListMemberInsert = TablesInsert<'listMembers'>
type CustomListMemberUpdate = TablesUpdate<'listMembers'>
type CustomListStarInsert = TablesInsert<'listStars'>
type CustomListItemFilters = {
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

type CustomListLeaderboardRecordEntryReference = Pick<CustomListLeaderboardRecordEntry, 'point' | 'no'>

type PlayerRankedListSummary = {
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

type CustomListRecordPlatformFilter = 'any' | 'pc' | 'mobile'
type CustomListRecordAcceptanceFilter = 'manual' | 'auto' | 'any'

type CustomListRecordFilterSettings = Pick<
    CustomList,
    'recordFilterPlatform'
    | 'recordFilterMinRefreshRate'
    | 'recordFilterMaxRefreshRate'
    | 'recordFilterManualAcceptanceOnly'
    | 'recordFilterAcceptanceStatus'
>

type CustomListRankBadge = {
    name: string
    shorthand: string
    color: string
    minRating: number | null
    minTop: number | null
}

type CustomListMemberRole = 'admin' | 'helper'

type CustomListResolvedRole = 'viewer' | 'owner' | 'admin' | 'helper' | 'moderator'

type CustomListPermissions = {
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

type CustomListAccessContext = {
    actorUid: string | null
    isModerator: boolean
    isOwner: boolean
    memberRole: CustomListMemberRole | null
    pendingInvitation: CustomListInvitation | null
}

type CustomListMemberWithPlayerData = CustomListMember & {
    playerData?: any
}

type CustomListInvitationWithPlayerData = CustomListInvitation & {
    playerData?: any
    invitedByData?: any
}

type CustomListAuditLogWithPlayerData = CustomListAuditLog & {
    actorData?: any
    targetData?: any
}

type CustomListActor = string | {
    uid: string
    isAdmin?: boolean | null
    isManager?: boolean | null
} | undefined

type BatchCustomListLevelInput = {
    levelId: number
    createdAt?: string
}

type CustomListSettingsPayload = {
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

const playerSelect = '*, clans!id(tag, tagBgColor, tagTextColor, boostedUntil)'

type CustomListWithOwnerData = CustomList & {
    ownerData?: any
    currentUserRole?: CustomListResolvedRole
    permissions?: CustomListPermissions
    members?: CustomListMemberWithPlayerData[]
    pendingInvitations?: CustomListInvitationWithPlayerData[]
    pendingInvitation?: CustomListInvitationWithPlayerData | null
    auditLog?: CustomListAuditLogWithPlayerData[]
}

type CustomListSubmission = CustomListLevelRow & {
    level?: any
    submitterData?: any
}

const VISIBILITY_VALUES = new Set(['private', 'unlisted', 'public'])
const MODE_VALUES = new Set(['rating', 'top'])
const CUSTOM_LIST_ITEM_SORT_VALUES = new Set(['mode_default', 'created_at'])
const CUSTOM_LIST_RECORD_PLATFORM_VALUES = new Set<CustomListRecordPlatformFilter>(['any', 'pc', 'mobile'])
const CUSTOM_LIST_RECORD_ACCEPTANCE_VALUES = new Set<CustomListRecordAcceptanceFilter>(['manual', 'auto', 'any'])
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/
const WEIGHT_FORMULA_VALIDATION_SCOPE = {
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
const RECORD_SCORE_FORMULA_VALIDATION_SCOPE = {
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
const CUSTOM_LIST_RANK_BADGE_LIMIT = 20
const CUSTOM_LIST_AUDIT_LOG_LIMIT = 50
const CUSTOM_LIST_MEMBER_ROLE_VALUES = new Set<CustomListMemberRole>(['admin', 'helper'])
const POINTERCRATE_MIRROR_LIST_ID = 109
const POINTERCRATE_MIRROR_CRAWL_MAX_PAGE_LIMIT = 25

function buildCustomListInvitationRedirect(list: Pick<CustomList, 'id' | 'slug'>) {
    return `/lists/${list.slug || list.id}/collaborator-invitation`
}

function buildCustomListInvitationRejectRedirect(list: Pick<CustomList, 'id' | 'slug' | 'visibility'>) {
    if (list.visibility === 'private') {
        return '/lists'
    }

    return `/lists/${list.slug || list.id}`
}

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

const CUSTOM_LIST_FORMULA_DISABLED_FUNCTIONS = [
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

const customListFormulaMath = create(all)
const parseCustomListFormulaNode = customListFormulaMath.parse.bind(customListFormulaMath)

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

function getCustomListFormulaNodeType(node: any) {
    if (typeof node?.type === 'string') {
        return node.type
    }

    if (typeof node?.mathjs === 'string') {
        return node.mathjs
    }

    return null
}

function assertCustomListFormulaNodeIsSafe(node: any, formulaName: string) {
    node.traverse((child: any) => {
        if (getCustomListFormulaNodeType(child) === 'FunctionAssignmentNode') {
            throw new ValidationError(`${formulaName} custom functions are disabled`)
        }
    })
}

function validateCustomListFormulaExpression(value: string, formulaName: string) {
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

function normalizeCustomListFormulaResult(result: unknown, formulaName: string): number {
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

function evaluateCustomListFormulaExpression(value: string, scope: Record<string, number>, formulaName: string) {
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

function evaluateWeightFormulaExpression(value: string, scope: {
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

function evaluateRecordScoreFormulaExpression(value: string, scope: {
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

function sanitizeThemeColor(value: unknown, fieldName: string) {
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

function sanitizeThemeUrl(value: unknown, fieldName: string) {
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

function sanitizeTopEnabled(value: unknown) {
    if (value == null) {
        return true
    }

    if (typeof value !== 'boolean') {
        throw new ValidationError('topEnabled must be a boolean')
    }

    return value
}

function sanitizeLeaderboardEnabled(value: unknown) {
    if (value == null) {
        return true
    }

    if (typeof value !== 'boolean') {
        throw new ValidationError('leaderboardEnabled must be a boolean')
    }

    return value
}

function sanitizeLevelSubmissionEnabled(value: unknown) {
    if (value == null) {
        return false
    }

    if (typeof value !== 'boolean') {
        throw new ValidationError('levelSubmissionEnabled must be a boolean')
    }

    return value
}

function sanitizeCustomListItemSort(value: unknown) {
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

function sanitizeCustomListRecordPlatform(value: unknown): CustomListRecordPlatformFilter {
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

function sanitizeCustomListRecordRefreshRate(value: unknown, label: 'recordFilterMinRefreshRate' | 'recordFilterMaxRefreshRate') {
    if (value == null || value === '') {
        return null
    }

    const refreshRate = Number(value)

    if (!Number.isInteger(refreshRate) || refreshRate < 1) {
        throw new ValidationError(`${label} must be a positive integer`)
    }

    return refreshRate
}

function sanitizeCustomListManualAcceptanceOnly(value: unknown) {
    if (value == null) {
        return true
    }

    if (typeof value !== 'boolean') {
        throw new ValidationError('recordFilterManualAcceptanceOnly must be a boolean')
    }

    return value
}

function sanitizeCustomListRecordAcceptanceStatus(value: unknown): CustomListRecordAcceptanceFilter {
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

function sanitizeListLevelCreatedAt(value: unknown) {
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

function sanitizeBatchCustomListLevelInputs(value: unknown) {
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

function sanitizeLevelReorderIds(value: unknown) {
    if (!Array.isArray(value) || !value.every((id) => Number.isInteger(id) && id > 0)) {
        throw new ValidationError('levelIds must be an array of positive integers')
    }

    return value as number[]
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

function sanitizeCustomListFormula(
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

function sanitizeWeightFormula(value: unknown) {
    return sanitizeCustomListFormula(value, 'weightFormula', '1', WEIGHT_FORMULA_VALIDATION_SCOPE)
}

function sanitizeRecordScoreFormula(value: unknown) {
    return sanitizeCustomListFormula(value, 'recordScoreFormula', '1', RECORD_SCORE_FORMULA_VALIDATION_SCOPE)
}

function sanitizeRankBadgeName(value: unknown) {
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

function sanitizeRankBadgeShorthand(value: unknown, fallback: string) {
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

function sanitizeRankBadgeColor(value: unknown) {
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

function sanitizeRankBadgeMinRating(value: unknown) {
    if (value == null || value === '') {
        return null
    }

    const rating = Number(value)

    if (!Number.isFinite(rating) || rating < 0) {
        throw new ValidationError('Rank badge minimum rating must be 0 or greater')
    }

    return rating
}

function sanitizeRankBadgeMinTop(value: unknown) {
    if (value == null || value === '') {
        return null
    }

    const top = Number(value)

    if (!Number.isInteger(top) || top < 1) {
        throw new ValidationError('Rank badge minimum top must be a positive integer')
    }

    return top
}

function sanitizeRankBadges(value: unknown): CustomListRankBadge[] {
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

function normalizeRankBadges(value: unknown): CustomListRankBadge[] {
    try {
        return sanitizeRankBadges(value)
    } catch {
        return []
    }
}

function getCustomListRecordPlatform(list: Pick<CustomList, 'recordFilterPlatform'>) {
    return CUSTOM_LIST_RECORD_PLATFORM_VALUES.has(list.recordFilterPlatform as CustomListRecordPlatformFilter)
        ? list.recordFilterPlatform as CustomListRecordPlatformFilter
        : 'any'
}

function getCustomListRecordMinRefreshRate(list: Pick<CustomList, 'recordFilterMinRefreshRate'>) {
    return Number.isInteger(list.recordFilterMinRefreshRate) && Number(list.recordFilterMinRefreshRate) > 0
        ? Number(list.recordFilterMinRefreshRate)
        : null
}

function getCustomListRecordMaxRefreshRate(list: Pick<CustomList, 'recordFilterMaxRefreshRate'>) {
    return Number.isInteger(list.recordFilterMaxRefreshRate) && Number(list.recordFilterMaxRefreshRate) > 0
        ? Number(list.recordFilterMaxRefreshRate)
        : null
}

function getCustomListRecordAcceptanceStatus(list: Pick<CustomList, 'recordFilterAcceptanceStatus' | 'recordFilterManualAcceptanceOnly'>): CustomListRecordAcceptanceFilter {
    const status = list.recordFilterAcceptanceStatus

    if (CUSTOM_LIST_RECORD_ACCEPTANCE_VALUES.has(status as CustomListRecordAcceptanceFilter)) {
        return status as CustomListRecordAcceptanceFilter
    }

    return (list.recordFilterManualAcceptanceOnly ?? true) ? 'manual' : 'any'
}

function getManualAcceptanceOnlyForStatus(status: CustomListRecordAcceptanceFilter) {
    return status === 'manual'
}

function isCustomListRecordAccepted(record: {
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

function isCustomListRecordEligibleForFilters(record: {
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

function applyCustomListRecordFiltersToQuery(
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

function sanitizeRating(value: unknown) {
    const n = Number(value)
    if (!Number.isFinite(n) || n < 0) {
        throw new ValidationError('Rating must be a number greater than or equal to 0')
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

function sanitizeCustomListVideoId(value: unknown) {
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

function sanitizeActorUid(value: unknown, label: string) {
    if (typeof value !== 'string' || !value.trim().length) {
        throw new ValidationError(`Invalid ${label}`)
    }

    return value.trim()
}

function sanitizeCustomListMemberRole(value: unknown): CustomListMemberRole {
    if (typeof value !== 'string') {
        throw new ValidationError('role must be either "admin" or "helper"')
    }

    const normalized = value.trim().toLowerCase()

    if (!CUSTOM_LIST_MEMBER_ROLE_VALUES.has(normalized as CustomListMemberRole)) {
        throw new ValidationError('role must be either "admin" or "helper"')
    }

    return normalized as CustomListMemberRole
}

function sanitizeAdminsCanManageHelpers(value: unknown) {
    if (typeof value !== 'boolean') {
        throw new ValidationError('adminsCanManageHelpers must be a boolean')
    }

    return value
}

async function getPlayersByUid(uids: string[]) {
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

async function ensurePlayerExists(uid: string) {
    const players = await getPlayersByUid([uid])
    const player = players.get(uid)

    if (!player) {
        throw new NotFoundError('Player not found')
    }

    return player
}

async function getCustomListMembership(listId: number, uid?: string | null) {
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

async function getCustomListInvitation(listId: number, uid?: string | null) {
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

async function hydrateCustomListInvitation(invitation: CustomListInvitation | null) {
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

async function getCustomListInvitations(listId: number) {
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

async function deleteCustomListInvitation(listId: number, uid: string) {
    const { error } = await supabase
        .from('listInvitations')
        .delete()
        .eq('listId', listId)
        .eq('uid', uid)

    if (error) {
        throw new Error(error.message)
    }
}

async function getCustomListMembers(listId: number) {
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

async function getCustomListAuditLog(listId: number, limit: number = CUSTOM_LIST_AUDIT_LOG_LIMIT) {
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

async function appendCustomListAuditLog(listId: number, entry: {
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

function normalizeCustomListAuditValue(value: unknown): unknown {
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

function areCustomListValuesEqual(left: unknown, right: unknown) {
    return JSON.stringify(normalizeCustomListAuditValue(left)) === JSON.stringify(normalizeCustomListAuditValue(right))
}

function getEffectiveMinProgress(item: any) {
    return item.minProgress ?? item.level?.minProgress ?? null
}

function getEffectiveVideoID(item: any) {
    return item.videoID ?? item.level?.videoID ?? null
}

function getNormalizedListPosition(item: any, index: number, _isSyntheticOfficialList: boolean) {
    if (item.position == null) {
        return index + 1
    }

    return Number(item.position)
}

async function ensureStoredTopPositions(listId: number) {
    const { data, error } = await supabase
        .from('listLevels')
        .select('id, position, created_at')
        .eq('listId', listId)
        .eq('accepted', true)
        .order('position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })

    if (error) {
        throw new Error(error.message)
    }

    const items = data || []

    if (!items.length) {
        return
    }

    const updates = items
        .map((item, index) => ({
            id: item.id,
            position: index + 1,
            shouldUpdate: Number(item.position) !== index + 1
        }))
        .filter((item) => item.shouldUpdate)

    if (!updates.length) {
        return
    }

    const results = await Promise.all(
        updates.map((item) =>
            supabase
                .from('listLevels')
                .update({ position: item.position })
                .eq('id', item.id)
        )
    )

    for (const result of results) {
        if (result.error) {
            throw new Error(result.error.message)
        }
    }
}

async function ensureStoredRatingPositions(listId: number) {
    const { data, error } = await supabase
        .from('listLevels')
        .select('id, rating, position, created_at')
        .eq('listId', listId)
        .eq('accepted', true)
        .order('rating', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })

    if (error) {
        throw new Error(error.message)
    }

    const items = data || []

    if (!items.length) {
        return
    }

    let pos = 1
    let prevRating: number | null = null

    const updates = items
        .map((item, index) => {
            if (index === 0) {
                pos = 1
            } else if (Number(item.rating) !== prevRating) {
                pos++
            }
            prevRating = Number(item.rating)
            return {
                id: item.id,
                position: pos,
                shouldUpdate: Number(item.position) !== pos
            }
        })
        .filter((item) => item.shouldUpdate)

    if (!updates.length) {
        return
    }

    const results = await Promise.all(
        updates.map((item) =>
            supabase
                .from('listLevels')
                .update({ position: item.position })
                .eq('id', item.id)
        )
    )

    for (const result of results) {
        if (result.error) {
            throw new Error(result.error.message)
        }
    }
}

function getItemIsPlatformer(item: any, fallbackIsPlatformer: boolean) {
    return Boolean(item.level?.isPlatformer ?? fallbackIsPlatformer)
}

function getRecordAcceptancePriority(record: { acceptedManually?: boolean | null; acceptedAuto?: boolean | null } | null | undefined) {
    if (record?.acceptedManually) {
        return 2
    }

    return record?.acceptedAuto ? 1 : 0
}

function isBetterRecordForListItem(
    candidate: { progress?: number | null; acceptedManually?: boolean | null; acceptedAuto?: boolean | null } | null | undefined,
    existing: { progress?: number | null; acceptedManually?: boolean | null; acceptedAuto?: boolean | null } | null | undefined,
    item: any,
    isPlatformer: boolean
) {
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

    const candidateAcceptancePriority = getRecordAcceptancePriority(candidate)
    const existingAcceptancePriority = getRecordAcceptancePriority(existing)

    if (candidateAcceptancePriority !== existingAcceptancePriority) {
        return candidateAcceptancePriority > existingAcceptancePriority
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

function getCustomListRecordFormulaBaseScope(
    list: Awaited<ReturnType<typeof getCustomList>>,
    item: any,
    itemIndex: number,
    levelCount: number,
    record: { progress?: number | null }
) {
    const progress = Math.max(0, Number(record.progress) || 0)
    const minProgress = Number(getEffectiveMinProgress(item) ?? 0)

    return {
        levelCount,
        top: getNormalizedListPosition(item, itemIndex, list.id < 0),
        rating: Number(item.rating ?? item.level?.rating ?? 0),
        time: progress,
        baseTime: minProgress,
        minProgress,
        progress
    }
}

function getCustomListRecordScore(
    list: Awaited<ReturnType<typeof getCustomList>>,
    item: any,
    itemIndex: number,
    levelCount: number,
    record: { progress?: number | null }
) {
    const score = evaluateRecordScoreFormulaExpression(
        list.recordScoreFormula || '1',
        getCustomListRecordFormulaBaseScope(list, item, itemIndex, levelCount, record)
    )

    return score
}

function getCustomListRecordPoint(
    list: Awaited<ReturnType<typeof getCustomList>>,
    item: any,
    itemIndex: number,
    position: number,
    levelCount: number,
    record: { progress?: number | null },
    score: number
) {
    const recordPoint = evaluateWeightFormulaExpression(list.weightFormula || '1', {
        ...getCustomListRecordFormulaBaseScope(list, item, itemIndex, levelCount, record),
        score,
        position
    })

    return roundCustomListSnapshotValue(recordPoint)
}

async function enrichItemsWithViewerEligibleRecords(
    items: any[],
    list: Pick<CustomList, 'isPlatformer'> & CustomListRecordFilterSettings,
    viewerId?: string
) {
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
            .select('levelid, progress, acceptedManually, acceptedAuto, mobile, refreshRate')
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

            if (!isCustomListRecordEligibleForFilters(record, list)) {
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
                acceptedAuto: Boolean(record?.acceptedAuto),
                acceptedManually: Boolean(record?.acceptedManually),
                isChecked: Boolean(record?.acceptedManually) || Boolean(record?.acceptedAuto),
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
        backgroundColor: null,
        bannerUrl: null,
        borderColor: null,
        visibility: 'public',
        tags: ['official'],
        levelCount,
        isPlatformer: config.isPlatformer,
        isOfficial: true,
        communityEnabled: false,
        leaderboardEnabled: true,
        levelSubmissionEnabled: false,
        faviconUrl: null,
        logoUrl: null,
        recordFilterPlatform: 'any',
        recordFilterMinRefreshRate: null,
        recordFilterMaxRefreshRate: null,
        recordFilterAcceptanceStatus: 'manual',
        recordFilterManualAcceptanceOnly: true,
        topEnabled: config.mode === 'top',
        itemSort: 'mode_default',
        mode: config.mode,
        rankBadges: [],
        recordScoreFormula: config.recordScoreFormula,
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
    const config = getOfficialListConfig(slug)
    const levels = await config.loadLevels({ start: 0, end: 4999, uid: '' })

    return {
        id: -1,
        slug: config.slug,
        owner: '',
        title: config.title,
        description: config.description,
        backgroundColor: null,
        bannerUrl: null,
        borderColor: null,
        visibility: 'public',
        tags: ['official'],
        levelCount: levels.length,
        isPlatformer: config.isPlatformer,
        isOfficial: true,
        communityEnabled: false,
        leaderboardEnabled: true,
        levelSubmissionEnabled: false,
        faviconUrl: null,
        logoUrl: null,
        recordFilterPlatform: 'any',
        recordFilterMinRefreshRate: null,
        recordFilterMaxRefreshRate: null,
        recordFilterAcceptanceStatus: 'manual',
        recordFilterManualAcceptanceOnly: true,
        topEnabled: config.mode === 'top',
        itemSort: 'mode_default',
        mode: config.mode,
        rankBadges: [],
        recordScoreFormula: config.recordScoreFormula,
        weightFormula: config.weightFormula,
        lastRefreshedAt: null,
        updated_at: new Date().toISOString(),
        starCount: 0,
        starred: false
    }
}

async function fetchCustomListLeaderboardSourceRecords(
    levelIds: number[],
    list: CustomListRecordFilterSettings
) {
    if (!levelIds.length) {
        return [] as any[]
    }

    const rows: any[] = []

    // Supabase caps uncapped select queries at 1000 rows, so page until the filtered result set is exhausted.
    for (let start = 0; ; start += CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE) {
        const end = start + CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE - 1
        const query = applyCustomListRecordFiltersToQuery(
            supabase
                .from('records')
                .select('userid, levelid, progress, timestamp, acceptedManually, acceptedAuto, mobile, refreshRate, players!userid!inner(uid)')
                .eq('players.isHidden', false)
                .in('levelid', levelIds)
                .order('userid', { ascending: true })
                .order('levelid', { ascending: true }),
            list
        )
        const { data, error } = await query.range(start, end)

        if (error) {
            throw new Error(error.message)
        }

        if (!data?.length) {
            break
        }

        rows.push(...data.filter((record: any) => isCustomListRecordEligibleForFilters(record, list)))

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

    const data = await fetchCustomListLeaderboardSourceRecords(levelIds, list)

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

    // Step 3: Calculate record scores, sort each uid's records by score, assign no, then apply final score formula
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

        const scoredEntries = entries.map((entry) => ({
            ...entry,
            score: getCustomListRecordScore(
                list,
                entry.itemData.item,
                entry.itemData.index,
                items.length,
                entry.record
            )
        }))

        scoredEntries.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score
            }

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

        for (let i = 0; i < scoredEntries.length; i++) {
            const { record, itemData, score } = scoredEntries[i]
            const no = i + 1
            const recordPoint = getCustomListRecordPoint(
                list,
                itemData.item,
                itemData.index,
                no,
                items.length,
                record,
                score
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

async function deleteCustomListLeaderboardArtifacts(listId: number) {
    const results = await Promise.all([
        (supabase as any)
            .from('playerCardStatLines')
            .delete()
            .eq('listId', listId),
        (supabase as any)
            .from('listLeaderboardEntries')
            .delete()
            .eq('listId', listId),
        (supabase as any)
            .from('listLeaderboardRecordEntries')
            .delete()
            .eq('listId', listId)
    ])

    for (const result of results) {
        if (result.error) {
            throw new Error(result.error.message)
        }
    }
}

async function persistDisabledCustomListLeaderboard(listId: number) {
    await deleteCustomListLeaderboardArtifacts(listId)

    const lastRefreshedAt = new Date().toISOString()
    const { data, error } = await (supabase as any)
        .from('listLeaderboardRefreshes')
        .upsert({
            listId,
            totalPlayers: 0,
            totalRecords: 0,
            lastRefreshedAt
        }, {
            onConflict: 'listId'
        })
        .select('id, listId, totalPlayers, totalRecords, lastRefreshedAt')
        .single()

    if (error || !data) {
        throw new Error(error?.message || 'Failed to persist leaderboard refresh')
    }

    return data as CustomListLeaderboardRefreshRow
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

async function getCustomListAccess(list: Pick<CustomList, 'id' | 'owner' | 'adminsCanManageHelpers' | 'isBanned'>, actor: CustomListActor) {
    const actorUid = getActorUid(actor) ?? null
    const isModerator = canModerateList(actor)
    const isOwner = Boolean(actorUid && list.owner === actorUid)
    let memberRole: CustomListMemberRole | null = null
    let pendingInvitation: CustomListInvitation | null = null

    if (!isOwner && actorUid) {
        const membership = await getCustomListMembership(list.id, actorUid)

        if (membership?.role === 'admin' || membership?.role === 'helper') {
            memberRole = membership.role
        } else {
            pendingInvitation = await getCustomListInvitation(list.id, actorUid)
        }
    }

    return {
        actorUid,
        isModerator,
        isOwner,
        memberRole,
        pendingInvitation
    } satisfies CustomListAccessContext
}

function resolveCustomListRole(access: CustomListAccessContext): CustomListResolvedRole {
    if (access.isOwner) {
        return 'owner'
    }

    if (access.isModerator) {
        return 'moderator'
    }

    return access.memberRole || 'viewer'
}

function canReadPrivateList(access: CustomListAccessContext) {
    return access.isOwner || access.isModerator || access.memberRole !== null || access.pendingInvitation !== null
}

function canEditCustomListSettings(list: Pick<CustomList, 'isBanned'>, access: CustomListAccessContext) {
    if (access.isModerator) {
        return true
    }

    if (list.isBanned) {
        return false
    }

    return access.isOwner || access.memberRole === 'admin'
}

function canEditCustomListLevels(list: Pick<CustomList, 'isBanned'>, access: CustomListAccessContext) {
    if (access.isModerator) {
        return true
    }

    if (list.isBanned) {
        return false
    }

    return access.isOwner || access.memberRole === 'admin' || access.memberRole === 'helper'
}

function canReviewCustomListSubmissions(list: Pick<CustomList, 'isOfficial'>, access: CustomListAccessContext) {
    if (list.isOfficial) {
        return access.isModerator
    }

    return access.isModerator || access.isOwner || access.memberRole === 'admin'
}

function canConfigureCustomListCollaboration(list: Pick<CustomList, 'isBanned'>, access: CustomListAccessContext) {
    return access.isOwner && !list.isBanned
}

function canManageCustomListMembers(list: Pick<CustomList, 'isBanned' | 'adminsCanManageHelpers'>, access: CustomListAccessContext) {
    if (list.isBanned) {
        return false
    }

    if (access.isOwner) {
        return true
    }

    return access.memberRole === 'admin' && Boolean(list.adminsCanManageHelpers)
}

function canTransferCustomListOwnership(list: Pick<CustomList, 'isBanned'>, access: CustomListAccessContext) {
    return access.isOwner && !list.isBanned
}

function canViewCustomListMembers(access: CustomListAccessContext) {
    return access.isOwner || access.isModerator || access.memberRole === 'admin'
}

function canViewCustomListAudit(access: CustomListAccessContext) {
    return access.isOwner || access.isModerator || access.memberRole !== null
}

function canViewCustomListPendingInvitations(access: CustomListAccessContext) {
    return access.isOwner || access.isModerator || access.memberRole === 'admin'
}

function canRespondToCustomListInvitation(access: CustomListAccessContext) {
    return access.pendingInvitation !== null
}

function getCustomListPermissions(list: Pick<CustomList, 'isBanned' | 'isOfficial' | 'adminsCanManageHelpers'>, access: CustomListAccessContext): CustomListPermissions {
    return {
        canEditSettings: canEditCustomListSettings(list, access),
        canEditLevels: canEditCustomListLevels(list, access),
        canReviewSubmissions: canReviewCustomListSubmissions(list, access),
        canDelete: access.isOwner && !list.isBanned && !list.isOfficial,
        canBan: access.isModerator && !list.isOfficial,
        canManageMembers: canManageCustomListMembers(list, access),
        canConfigureCollaboration: canConfigureCustomListCollaboration(list, access),
        canTransferOwnership: canTransferCustomListOwnership(list, access),
        canViewMembers: canViewCustomListMembers(access),
        canViewAudit: canViewCustomListAudit(access),
        canViewPendingInvitations: canViewCustomListPendingInvitations(access),
        canRespondToInvitation: canRespondToCustomListInvitation(access)
    }
}

function getCustomListBannedEditMessage(access: CustomListAccessContext) {
    return access.isOwner
        ? 'This list has been banned and cannot be edited by the owner'
        : 'This list has been banned and cannot be edited'
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

async function assertOwnerEditable(list: CustomList, actor: CustomListActor) {
    const access = await getCustomListAccess(list, actor)

    if (!access.isOwner) {
        throw new ForbiddenError('You do not own this list')
    }

    if (list.isBanned) {
        throw new ForbiddenError('This list has been banned and cannot be edited by the owner')
    }

    return access
}

async function assertCanEditList(list: CustomList, actor: CustomListActor) {
    const access = await getCustomListAccess(list, actor)

    if (canEditCustomListSettings(list, access)) {
        return access
    }

    if (list.isBanned && (access.isOwner || access.memberRole)) {
        throw new ForbiddenError(getCustomListBannedEditMessage(access))
    }

    throw new ForbiddenError('You do not have permission to edit this list')
}

async function assertCanEditListLevels(list: CustomList, actor: CustomListActor) {
    const access = await getCustomListAccess(list, actor)

    if (canEditCustomListLevels(list, access)) {
        return access
    }

    if (list.isBanned && (access.isOwner || access.memberRole)) {
        throw new ForbiddenError(getCustomListBannedEditMessage(access))
    }

    throw new ForbiddenError('You do not have permission to modify levels on this list')
}

async function assertReadable(list: CustomList, actor?: CustomListActor) {
    const access = await getCustomListAccess(list, actor)

    if (list.visibility === 'private' && !canReadPrivateList(access)) {
        throw new ForbiddenError('This list is private')
    }

    return access
}

async function assertCanManageListMembers(list: CustomList, actor: CustomListActor, options: {
    targetRole?: CustomListMemberRole
    targetMember?: CustomListMember | null
} = {}) {
    const access = await getCustomListAccess(list, actor)

    if (canConfigureCustomListCollaboration(list, access)) {
        return access
    }

    if (list.isBanned && (access.isOwner || access.memberRole)) {
        throw new ForbiddenError('This list has been banned and collaborators cannot be changed')
    }

    if (!canManageCustomListMembers(list, access)) {
        throw new ForbiddenError('You do not have permission to manage collaborators for this list')
    }

    if (access.memberRole === 'admin' && !access.isOwner) {
        if (options.targetRole && options.targetRole !== 'helper') {
            throw new ForbiddenError('Only the owner can assign admin access')
        }

        if (options.targetMember && options.targetMember.role !== 'helper') {
            throw new ForbiddenError('Only the owner can manage admin collaborators')
        }
    }

    return access
}

async function assertCanTransferListOwnership(list: CustomList, actor: CustomListActor) {
    const access = await getCustomListAccess(list, actor)

    if (canTransferCustomListOwnership(list, access)) {
        return access
    }

    if (list.isBanned && access.isOwner) {
        throw new ForbiddenError('This list has been banned and ownership cannot be transferred')
    }

    throw new ForbiddenError('Only the owner can transfer ownership')
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
        .eq('accepted', true)

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

    return count ?? 0
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

    const existingLevel = await supabase
        .from('levels')
        .select('id')
        .eq('id', levelId)
        .maybeSingle()

    if (existingLevel.error) {
        throw new Error(existingLevel.error.message)
    }

    if (existingLevel.data) {
        return await getLevel(levelId)
    }

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

async function getCustomListItems(listId: number, mode: string = 'rating', itemRange?: {
    start?: number
    end?: number
}, itemSort: string = 'mode_default', itemFilters?: CustomListItemFilters) {
    const isTop = mode === 'top'

    if (isTop) {
        await ensureStoredTopPositions(listId)
    } else {
        await ensureStoredRatingPositions(listId)
    }

    const filters = itemFilters ?? {}
    const nameSearchParams = buildFullTextSearchParams(filters.nameSearch, filters.searchType)
    const creatorSearchParams = buildFullTextSearchParams(filters.creatorSearch, filters.searchType)

    let levelIdFilter: number[] | null = null

    if (filters.tagIds && filters.tagIds.length > 0) {
        const { data: tagRows, error: tagError } = await (supabase as any)
            .from('levelsTags')
            .select('level_id')
            .in('tag_id', filters.tagIds)

        if (tagError) {
            throw new Error(tagError.message)
        }

        const tagFilteredIds = [...new Set((tagRows || []).map((row: any) => row.level_id as number))] as number[]

        if (tagFilteredIds.length === 0) {
            return []
        }

        levelIdFilter = tagFilteredIds
    }

    if (nameSearchParams || creatorSearchParams) {
        let levelQuery = supabase
            .from('levels')
            .select('id')

        if (nameSearchParams) {
            levelQuery = levelQuery.textSearch('nameFts', nameSearchParams.query, nameSearchParams.options)
        }

        if (creatorSearchParams) {
            levelQuery = levelQuery.textSearch('creatorFts', creatorSearchParams.query, creatorSearchParams.options)
        }

        if (levelIdFilter !== null) {
            levelQuery = levelQuery.in('id', levelIdFilter)
        }

        const { data: matchedLevels, error: levelMatchError } = await levelQuery

        if (levelMatchError) {
            throw new Error(levelMatchError.message)
        }

        const matchedIds = (matchedLevels || []).map((row) => row.id as number)

        if (matchedIds.length === 0) {
            return []
        }

        levelIdFilter = matchedIds
    }

    let itemsQuery = supabase
        .from('listLevels')
        .select('id, created_at, listId, levelId, addedBy, rating, position, minProgress, videoID, accepted, submissionComment')
        .eq('listId', listId)
        .eq('accepted', true)

    if (levelIdFilter !== null) {
        itemsQuery = itemsQuery.in('levelId', levelIdFilter)
    }

    if (filters.topMin != null) {
        itemsQuery = itemsQuery.gte('position', filters.topMin)
    }

    if (filters.topMax != null) {
        itemsQuery = itemsQuery.lte('position', filters.topMax)
    }

    if (filters.ratingMin != null) {
        itemsQuery = itemsQuery.gte('rating', filters.ratingMin)
    }

    if (filters.ratingMax != null) {
        itemsQuery = itemsQuery.lte('rating', filters.ratingMax)
    }

    const overrideAscending = filters.ascending

    if (itemSort === 'created_at') {
        const ascending = overrideAscending ?? true
        itemsQuery = itemsQuery
            .order('created_at', { ascending })
            .order('id', { ascending })
    } else {
        const defaultAscending = isTop
        const ascending = overrideAscending ?? defaultAscending
        itemsQuery = itemsQuery
            .order(isTop ? 'position' : 'rating', { ascending, nullsFirst: false })
            .order('created_at', { ascending: true })
            .order('id', { ascending: true })
    }

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
        .select('*, creatorData:players!creatorId(*, clans!id(*)), levelsTags(tag_id, levelTags(id, name, color))')
        .in('id', levelIds)

    if (levelsError) {
        throw new Error(levelsError.message)
    }

    const levelsById = new Map((levels || []).map((level) => [level.id, level]))

    return (items || []).map((item) => {
        const level = levelsById.get(item.levelId) ?? null

        return {
            ...item,
            level: level
                ? {
                    ...level,
                    videoID: item.videoID ?? level.videoID ?? null
                }
                : null
        }
    })
}

function sanitizeSubmissionComment(value: unknown) {
    if (value == null) {
        return null
    }

    if (typeof value !== 'string') {
        throw new ValidationError('comment must be a string')
    }

    const trimmed = value.trim()

    if (!trimmed.length) {
        return null
    }

    if (trimmed.length > 1000) {
        throw new ValidationError('comment must be at most 1000 characters')
    }

    return trimmed
}

function sanitizeSubmissionPosition(value: unknown) {
    if (value == null || value === '') {
        return null
    }

    const position = Number(value)

    if (!Number.isInteger(position) || position < 1) {
        throw new ValidationError('position must be a positive integer')
    }

    return position
}

async function getCustomListSubmissionQueue(listId: number, actor: CustomListActor) {
    const list = await getCustomListRow(listId)
    const access = await getCustomListAccess(list, actor)

    if (!canReviewCustomListSubmissions(list, access)) {
        throw new ForbiddenError('You do not have permission to review submissions on this list')
    }

    const { data: submissions, error } = await supabase
        .from('listLevels')
        .select('id, created_at, listId, levelId, addedBy, rating, position, minProgress, videoID, accepted, submissionComment')
        .eq('listId', listId)
        .eq('accepted', false)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })

    if (error) {
        throw new Error(error.message)
    }

    const entries = (submissions || []) as CustomListSubmission[]

    if (!entries.length) {
        return [] as CustomListSubmission[]
    }

    const levelIds = [...new Set(entries.map((entry) => entry.levelId))]
    const submitterUids = [...new Set(entries.map((entry) => entry.addedBy).filter(Boolean))]

    const [levelsResult, submittersByUid] = await Promise.all([
        supabase
            .from('levels')
            .select('id, name, creator, difficulty, isPlatformer, rating, minProgress, videoID')
            .in('id', levelIds),
        getPlayersByUid(submitterUids)
    ])

    if (levelsResult.error) {
        throw new Error(levelsResult.error.message)
    }

    const levelsById = new Map((levelsResult.data || []).map((level) => [level.id, level]))

    return entries.map((entry) => ({
        ...entry,
        level: levelsById.get(entry.levelId) || null,
        submitterData: submittersByUid.get(entry.addedBy) || null
    }))
}

export async function getCustomListSubmissionQueueById(listId: number, actor: CustomListActor) {
    return getCustomListSubmissionQueue(listId, actor)
}

async function shiftAcceptedTopPositions(listId: number, startPosition: number) {
    const { data, error } = await supabase
        .from('listLevels')
        .select('id, position, created_at')
        .eq('listId', listId)
        .eq('accepted', true)
        .gte('position', startPosition)
        .order('position', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })

    if (error) {
        throw new Error(error.message)
    }

    const rows = (data || []) as Array<{ id: number; position: number | null }>

    for (const row of rows) {
        const nextPosition = Number(row.position) + 1

        const { error: updateError } = await supabase
            .from('listLevels')
            .update({ position: nextPosition })
            .eq('id', row.id)

        if (updateError) {
            throw new Error(updateError.message)
        }
    }
}

function sanitizeSubmissionReviewPayload(list: CustomList, payload: {
    accept?: unknown
    rating?: unknown
    minProgress?: unknown
    position?: unknown
    top?: unknown
    videoID?: unknown
    videoId?: unknown
}) {
    const accept = Boolean(payload.accept)
    const videoInput = payload.videoID !== undefined ? payload.videoID : payload.videoId
    const positionInput = payload.position !== undefined ? payload.position : payload.top

    if (!accept) {
        return {
            accept: false,
            rating: null as number | null,
            minProgress: null as number | null,
            position: null as number | null,
            videoID: videoInput !== undefined ? sanitizeCustomListVideoId(videoInput) : null
        }
    }

    if (list.mode === 'top') {
        return {
            accept: true,
            rating: payload.rating !== undefined ? sanitizeRating(payload.rating) : 5,
            minProgress: sanitizeMinProgress(payload.minProgress, list.isPlatformer),
            position: sanitizeSubmissionPosition(positionInput),
            videoID: videoInput !== undefined ? sanitizeCustomListVideoId(videoInput) : null
        }
    }

    return {
        accept: true,
        rating: sanitizeRating(payload.rating),
        minProgress: sanitizeMinProgress(payload.minProgress, list.isPlatformer),
        position: null as number | null,
        videoID: videoInput !== undefined ? sanitizeCustomListVideoId(videoInput) : null
    }
}

export async function submitLevelToCustomList(listId: number, actor: CustomListActor, payload: {
    levelId?: unknown
    videoID?: unknown
    videoLink?: unknown
    comment?: unknown
}) {
    const list = await getCustomListRow(listId)
    const actorUid = getRequiredActorUid(actor)

    if (!list.levelSubmissionEnabled) {
        throw new ForbiddenError('This list does not accept level submissions')
    }

    const levelId = Number(payload.levelId)
    requireLevelId(levelId)
    const level = await ensureLevelExists(levelId)
    assertLevelTypeMatchesList(list, level)

    const { data: existingSubmission, error: existingError } = await supabase
        .from('listLevels')
        .select('id, accepted')
        .eq('listId', listId)
        .eq('levelId', levelId)
        .maybeSingle()

    if (existingError) {
        throw new Error(existingError.message)
    }

    if (existingSubmission) {
        throw new ConflictError('Level already exists in this list')
    }

    const videoInput = payload.videoID !== undefined ? payload.videoID : payload.videoLink
    const submissionVideoID = sanitizeCustomListVideoId(videoInput)
    const submissionComment = sanitizeSubmissionComment(payload.comment)

    const itemInsert: CustomListLevelInsert = {
        listId,
        levelId,
        addedBy: actorUid,
        accepted: false,
        rating: 5,
        minProgress: null,
        position: null,
        videoID: submissionVideoID,
        submissionComment: submissionComment ?? null
    }

    const { error: insertError } = await supabase
        .from('listLevels')
        .insert(itemInsert)

    if (insertError) {
        throw new Error(insertError.message)
    }

    await touchCustomListActivity(listId)

    await appendCustomListAuditLog(listId, {
        actorUid,
        action: 'level_submitted',
        metadata: {
            levelId,
            levelName: level.name,
            creator: level.creator,
            videoID: submissionVideoID,
            comment: submissionComment
        }
    })

    return {
        levelId,
        levelName: level.name,
        creator: level.creator,
        videoID: submissionVideoID,
        comment: submissionComment
    }
}

export async function reviewCustomListSubmission(listId: number, actor: CustomListActor, levelId: number, payload: {
    accept?: unknown
    rating?: unknown
    minProgress?: unknown
    position?: unknown
    top?: unknown
    videoID?: unknown
    videoId?: unknown
}) {
    const list = await getCustomListRow(listId)
    const access = await getCustomListAccess(list, actor)

    if (!canReviewCustomListSubmissions(list, access)) {
        throw new ForbiddenError('You do not have permission to review submissions on this list')
    }

    const submissionLevelId = Number(levelId)
    requireLevelId(submissionLevelId)
    const submission = await supabase
        .from('listLevels')
        .select('id, created_at, listId, levelId, addedBy, rating, position, minProgress, videoID, accepted, submissionComment')
        .eq('listId', listId)
        .eq('levelId', submissionLevelId)
        .eq('accepted', false)
        .maybeSingle()

    if (submission.error) {
        throw new Error(submission.error.message)
    }

    const currentSubmission = submission.data as CustomListSubmission | null

    if (!currentSubmission) {
        throw new NotFoundError('Submission not found')
    }

    const reviewPayload = sanitizeSubmissionReviewPayload(list, payload)

    if (!reviewPayload.accept) {
        const { error: deleteError } = await supabase
            .from('listLevels')
            .delete()
            .eq('id', currentSubmission.id)

        if (deleteError) {
            throw new Error(deleteError.message)
        }

        await appendCustomListAuditLog(listId, {
            actorUid: access.actorUid,
            action: 'level_removed',
            metadata: {
                levelId: currentSubmission.levelId,
                levelItemId: currentSubmission.id,
                levelName: currentSubmission.level?.name ?? null,
                creator: currentSubmission.level?.creator ?? null,
                submittedBy: currentSubmission.addedBy ?? null,
                position: null,
                previousState: {
                    rating: currentSubmission.rating,
                    minProgress: currentSubmission.minProgress,
                    videoID: currentSubmission.videoID,
                    createdAt: currentSubmission.created_at,
                    position: currentSubmission.position
                }
            }
        })

        await touchCustomListActivity(listId)

        if (currentSubmission.addedBy) {
            await sendNotification({
                to: currentSubmission.addedBy,
                status: 2,
                content: `Level ${currentSubmission.level?.name || currentSubmission.levelId} (${currentSubmission.levelId}) bạn gửi vào list ${list.title} đã bị từ chối.`,
                redirect: `/lists/${listId}`
            })
        }

        return getCustomList(listId, actor)
    }

    const updates: Record<string, unknown> = {
        accepted: true,
        submissionComment: currentSubmission.submissionComment ?? null
    }

    if (reviewPayload.videoID !== null) {
        updates.videoID = reviewPayload.videoID
    }

    if (list.mode === 'top') {
        const currentTopCountResult = await supabase
            .from('listLevels')
            .select('id', { count: 'exact', head: true })
            .eq('listId', listId)
            .eq('accepted', true)

        if (currentTopCountResult.error) {
            throw new Error(currentTopCountResult.error.message)
        }

        const desiredPosition = reviewPayload.position ?? ((currentTopCountResult.count ?? 0) + 1)
        const nextPosition = Math.min(desiredPosition, (currentTopCountResult.count ?? 0) + 1)

        await shiftAcceptedTopPositions(listId, nextPosition)

        updates.position = nextPosition
        updates.rating = reviewPayload.rating ?? currentSubmission.rating ?? 5
        updates.minProgress = reviewPayload.minProgress
    } else {
        updates.rating = reviewPayload.rating
        updates.minProgress = reviewPayload.minProgress
        updates.position = null
    }

    const { error: updateError } = await supabase
        .from('listLevels')
        .update(updates)
        .eq('id', currentSubmission.id)

    if (updateError) {
        throw new Error(updateError.message)
    }

    await syncLevelCount(listId)
    await touchCustomListActivity(listId)

    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: 'level_added',
        metadata: {
            levelId: currentSubmission.levelId,
            levelItemId: currentSubmission.id,
            levelName: currentSubmission.level?.name ?? null,
            creator: currentSubmission.level?.creator ?? null,
            submittedBy: currentSubmission.addedBy ?? null,
            nextState: {
                rating: updates.rating,
                minProgress: updates.minProgress,
                videoID: updates.videoID ?? currentSubmission.videoID ?? null,
                createdAt: currentSubmission.created_at,
                position: updates.position
            }
        }
    })

    if (currentSubmission.addedBy) {
        await sendNotification({
            to: currentSubmission.addedBy,
            status: 1,
            content: `Level ${currentSubmission.level?.name || currentSubmission.levelId} (${currentSubmission.levelId}) bạn gửi vào list ${list.title} đã được chấp nhận.`,
            redirect: `/lists/${listId}`
        })
    }

    return getCustomList(listId, actor)
}

async function applyCustomListLevelOrder(listId: number, levelIds: number[]) {
    const updates = levelIds.map((levelId, index) =>
        supabase
            .from('listLevels')
            .update({ position: index + 1 })
            .eq('listId', listId)
            .eq('levelId', levelId)
            .eq('accepted', true)
    )

    const results = await Promise.all(updates)

    for (const result of results) {
        if (result.error) {
            throw new Error(result.error.message)
        }
    }
}

export async function batchSaveCustomListLevels(listId: number, actor: CustomListActor, payload: {
    settings?: unknown
    creates?: unknown
    updates?: unknown
    deletes?: unknown
    auditEntries?: unknown
    reorderLevelIds?: unknown
}) {
    const list = await getCustomListRow(listId)
    const hasSettingsInput = payload.settings !== undefined
    const createInputs = Array.isArray(payload.creates) ? payload.creates : []
    const updateInputs = Array.isArray(payload.updates) ? payload.updates : []
    const deleteInputs = Array.isArray(payload.deletes) ? payload.deletes : []
    const auditEntries = Array.isArray(payload.auditEntries) ? payload.auditEntries : []
    const reorderLevelIds = payload.reorderLevelIds !== undefined
        ? sanitizeLevelReorderIds(payload.reorderLevelIds)
        : []

    const deleteLevelIds = deleteInputs
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)

    const createLevelIds = createInputs
        .map((value) => Number((value as any)?.levelId))
        .filter((value) => Number.isInteger(value) && value > 0)

    const updateLevelIds = updateInputs
        .map((value) => Number((value as any)?.levelId))
        .filter((value) => Number.isInteger(value) && value > 0)

    const hasLevelChanges = Boolean(createLevelIds.length || updateLevelIds.length || deleteLevelIds.length || auditEntries.length || reorderLevelIds.length)

    if (!hasSettingsInput && !hasLevelChanges) {
        return getCustomList(listId, actor)
    }

    let settingsAccess: CustomListAccessContext | null = null
    let levelsAccess: CustomListAccessContext | null = null
    let workingList = list
    let settingsUpdatePlan: Awaited<ReturnType<typeof buildCustomListSettingsUpdatePlan>> | null = null

    if (hasSettingsInput) {
        if (!payload.settings || typeof payload.settings !== 'object' || Array.isArray(payload.settings)) {
            throw new ValidationError('settings must be an object')
        }

        settingsAccess = await assertCanEditList(list, actor)
        settingsUpdatePlan = await buildCustomListSettingsUpdatePlan(listId, workingList, payload.settings as CustomListSettingsPayload)

        if (settingsUpdatePlan.changedEntries.length) {
            workingList = {
                ...workingList,
                ...settingsUpdatePlan.updates
            } as CustomList
        }
    }

    if (hasLevelChanges) {
        levelsAccess = await assertCanEditListLevels(workingList, actor)
    }

    if (!hasLevelChanges && !settingsUpdatePlan?.changedEntries.length) {
        return getCustomList(listId, actor)
    }

    const access = levelsAccess ?? settingsAccess
    const actorUid = access?.actorUid ?? getRequiredActorUid(actor)
    const affectedLevelIds = [...new Set([...createLevelIds, ...updateLevelIds, ...deleteLevelIds])]
    let levelsById = new Map<number, { id: number; isPlatformer: boolean }>()

    if (createLevelIds.length || updateLevelIds.length) {
        const { data: existingLevels, error: existingLevelsError } = await supabase
            .from('levels')
            .select('id, isPlatformer')
            .in('id', affectedLevelIds)

        if (existingLevelsError) {
            throw new Error(existingLevelsError.message)
        }

        levelsById = new Map((existingLevels || []).map((level) => [level.id, level]))
    }

    for (const levelId of [...createLevelIds, ...updateLevelIds]) {
        const level = levelsById.get(levelId) || await ensureLevelExists(levelId)
        assertLevelTypeMatchesList(workingList, level)
    }

    if (settingsUpdatePlan?.changedEntries.length) {
        const { error } = await supabase
            .from('lists')
            .update(settingsUpdatePlan.updates)
            .eq('id', listId)

        if (error) {
            throw new Error(error.message)
        }

        await appendCustomListAuditLog(listId, {
            actorUid: settingsAccess?.actorUid ?? actorUid,
            action: 'list_updated',
            metadata: {
                fields: settingsUpdatePlan.changedEntries.map(([field]) => field),
                changes: settingsUpdatePlan.changes
            }
        })
    }

    if (workingList.mode === 'top') {
        await ensureStoredTopPositions(listId)
    } else {
        await ensureStoredRatingPositions(listId)
    }

    if (deleteLevelIds.length) {
        const { error: deleteError } = await supabase
            .from('listLevels')
            .delete()
            .eq('listId', listId)
            .eq('accepted', true)
            .in('levelId', deleteLevelIds)

        if (deleteError) {
            throw new Error(deleteError.message)
        }
    }

    if (createInputs.length) {
        const existingItemsResult = await supabase
            .from('listLevels')
            .select('levelId')
            .eq('listId', listId)
            .in('levelId', createLevelIds)

        if (existingItemsResult.error) {
            throw new Error(existingItemsResult.error.message)
        }

        const existingLevelIds = new Set((existingItemsResult.data || []).map((item) => item.levelId))
        const createRows: CustomListLevelInsert[] = []

        for (const rawInput of createInputs) {
            const levelId = Number((rawInput as any)?.levelId)

            if (!Number.isInteger(levelId) || levelId <= 0) {
                throw new ValidationError('Invalid level ID in batch create payload')
            }

            if (existingLevelIds.has(levelId)) {
                throw new ConflictError('Level already exists in this list')
            }

            const levelInput = rawInput as {
                createdAt?: unknown
                rating?: unknown
                minProgress?: unknown
                videoID?: unknown
                videoId?: unknown
                position?: unknown
                top?: unknown
            }

            const positionInput = levelInput.position !== undefined ? levelInput.position : levelInput.top
            const videoInput = levelInput.videoID !== undefined ? levelInput.videoID : levelInput.videoId
            const nextRow: CustomListLevelInsert = {
                listId,
                levelId,
                addedBy: actorUid,
                accepted: true,
                rating: Number.isFinite(Number(levelInput.rating)) ? Number(levelInput.rating) : 5,
                minProgress: levelInput.minProgress === undefined ? null : sanitizeMinProgress(levelInput.minProgress, workingList.isPlatformer),
                position: sanitizeSubmissionPosition(positionInput),
                videoID: videoInput === undefined ? null : sanitizeCustomListVideoId(videoInput)
            }

            if (levelInput.createdAt !== undefined) {
                nextRow.created_at = sanitizeListLevelCreatedAt(levelInput.createdAt)
            }

            createRows.push(nextRow)
        }

        const { error: insertError } = await supabase
            .from('listLevels')
            .insert(createRows)

        if (insertError) {
            throw new Error(insertError.message)
        }
    }

    if (updateInputs.length) {
        for (const rawInput of updateInputs) {
            const levelId = Number((rawInput as any)?.levelId)

            if (!Number.isInteger(levelId) || levelId <= 0) {
                throw new ValidationError('Invalid level ID in batch update payload')
            }

            const patch = rawInput as {
                rating?: unknown
                minProgress?: unknown
                videoID?: unknown
                videoId?: unknown
                createdAt?: unknown
                created_at?: unknown
            }

            const updates: Record<string, unknown> = {}

            if (patch.rating !== undefined) {
                updates.rating = sanitizeRating(patch.rating)
            }

            if (patch.minProgress !== undefined) {
                updates.minProgress = sanitizeMinProgress(patch.minProgress, workingList.isPlatformer)
            }

            const nextVideoID = patch.videoID !== undefined ? patch.videoID : patch.videoId

            if (nextVideoID !== undefined) {
                updates.videoID = sanitizeCustomListVideoId(nextVideoID)
            }

            const nextCreatedAt = patch.createdAt !== undefined ? patch.createdAt : patch.created_at

            if (nextCreatedAt !== undefined) {
                updates.created_at = sanitizeListLevelCreatedAt(nextCreatedAt)
            }

            if (!Object.keys(updates).length) {
                continue
            }

            const { data, error } = await supabase
                .from('listLevels')
                .update(updates)
                .eq('listId', listId)
                .eq('levelId', levelId)
                .eq('accepted', true)
                .select('id')
                .maybeSingle()

            if (error) {
                throw new Error(error.message)
            }

            if (!data) {
                throw new NotFoundError('Level is not in this list')
            }
        }
    }

    if (reorderLevelIds.length) {
        if (workingList.mode !== 'top') {
            throw new ValidationError('Reordering is only available in top mode')
        }

        await applyCustomListLevelOrder(listId, reorderLevelIds)
    }

    for (const entry of auditEntries as Array<{ actorUid?: string | null; action?: string; targetUid?: string | null; metadata?: Record<string, unknown> }>) {
        if (!entry?.action) {
            continue
        }

        await appendCustomListAuditLog(listId, {
            actorUid: entry.actorUid ?? actorUid,
            action: entry.action,
            targetUid: entry.targetUid ?? null,
            metadata: entry.metadata || {}
        })
    }

    if (reorderLevelIds.length) {
        await appendCustomListAuditLog(listId, {
            actorUid,
            action: 'levels_reordered',
            metadata: {
                levelIds: reorderLevelIds
            }
        })
    }

    await syncLevelCount(listId)
    await touchCustomListActivity(listId)

    return getCustomList(listId, actor)
}

type PointercrateMirrorCrawlFailure = {
    levelId: number
    position: number
    name: string
    error: string
}

type PointercrateMirrorCrawlCounters = {
    processed: number
    inserted: number
    updated: number
    unchanged: number
    failed: number
}

function getPointercrateMirrorCrawlObject(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {}
}

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error && error.message ? error.message : fallback
}

function sanitizePointercrateMirrorCrawlAfter(value: unknown) {
    if (value == null || value === '') {
        return 0
    }

    const after = Number(value)

    if (!Number.isInteger(after) || after < 0) {
        throw new ValidationError('Pointercrate cursor must be a non-negative integer')
    }

    return after
}

function sanitizePointercrateMirrorCrawlLimit(value: unknown) {
    let limit: number

    try {
        limit = normalizePointercrateListedDemonsLimit(value)
    } catch (error) {
        throw new ValidationError(getErrorMessage(error, 'Invalid Pointercrate page limit'))
    }

    if (limit > POINTERCRATE_MIRROR_CRAWL_MAX_PAGE_LIMIT) {
        throw new ValidationError(`Pointercrate crawl limit must be between 1 and ${POINTERCRATE_MIRROR_CRAWL_MAX_PAGE_LIMIT}`)
    }

    return limit
}

function sanitizePointercrateMirrorSourceLevelIds(value: unknown) {
    if (!Array.isArray(value)) {
        throw new ValidationError('Pointercrate source level IDs are required')
    }

    const sourceLevelIds = value.map((entry) => Number(entry))

    if (sourceLevelIds.some((levelId) => !Number.isInteger(levelId) || levelId <= 0)) {
        throw new ValidationError('Pointercrate source level IDs must be positive integers')
    }

    const uniqueLevelIds = [...new Set(sourceLevelIds)]

    if (!uniqueLevelIds.length) {
        throw new ValidationError('Pointercrate source level IDs are required')
    }

    return uniqueLevelIds
}

function sanitizePointercrateMirrorCrawlCounters(value: unknown): PointercrateMirrorCrawlCounters {
    const source = getPointercrateMirrorCrawlObject(value)
    const readCounter = (key: keyof PointercrateMirrorCrawlCounters) => {
        const parsed = Number(source[key])
        return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0
    }

    return {
        processed: readCounter('processed'),
        inserted: readCounter('inserted'),
        updated: readCounter('updated'),
        unchanged: readCounter('unchanged'),
        failed: readCounter('failed')
    }
}

function assertPointercrateMirrorListConfig(list: CustomList) {
    if (list.id !== POINTERCRATE_MIRROR_LIST_ID) {
        throw new ValidationError(`Pointercrate crawler is configured for list #${POINTERCRATE_MIRROR_LIST_ID}`)
    }

    if (list.isPlatformer) {
        throw new ValidationError('Pointercrate mirror list must be a classic list')
    }

    if (list.mode !== 'top') {
        throw new ValidationError('Pointercrate mirror list must use top mode')
    }
}

function getPointercrateDemonVideoID(demon: PointercrateListedDemon) {
    if (!demon.video) {
        return null
    }

    try {
        return sanitizeCustomListVideoId(demon.video)
    } catch {
        return null
    }
}

function getUniquePointercrateDemons(demons: PointercrateListedDemon[]) {
    const seenLevelIds = new Set<number>()
    const uniqueDemons: PointercrateListedDemon[] = []

    for (const demon of demons) {
        if (seenLevelIds.has(demon.level_id)) {
            continue
        }

        seenLevelIds.add(demon.level_id)
        uniqueDemons.push(demon)
    }

    return uniqueDemons
}

async function ensurePointercrateMirrorLevels(demons: PointercrateListedDemon[]) {
    const levelIds = [...new Set(demons.map((demon) => demon.level_id))]
    const levelsById = new Map<number, { id: number; isPlatformer: boolean }>()
    const failures = new Map<number, string>()

    if (!levelIds.length) {
        return { levelsById, failures }
    }

    const { data: existingLevels, error: existingLevelsError } = await supabase
        .from('levels')
        .select('id, isPlatformer')
        .in('id', levelIds)

    if (existingLevelsError) {
        throw new Error(existingLevelsError.message)
    }

    for (const level of existingLevels || []) {
        levelsById.set(level.id, {
            id: level.id,
            isPlatformer: Boolean(level.isPlatformer)
        })
    }

    const missingLevelIds = levelIds.filter((levelId) => !levelsById.has(levelId))
    const levelInserts: TablesInsert<'levels'>[] = []

    for (const levelId of missingLevelIds) {
        try {
            const gdLevel = await fetchLevelFromGD(levelId)
            const isPlatformer = gdLevel.length == 5

            levelInserts.push({
                id: levelId,
                name: gdLevel.name,
                creator: gdLevel.author,
                difficulty: gdLevel.difficulty ?? null,
                isPlatformer,
                isChallenge: false,
                isNonList: false
            } as TablesInsert<'levels'>)
            levelsById.set(levelId, { id: levelId, isPlatformer })
        } catch (error) {
            failures.set(levelId, getErrorMessage(error, 'Level not found on the official Geometry Dash server'))
        }
    }

    if (levelInserts.length) {
        const { error } = await supabase
            .from('levels')
            .upsert(levelInserts as any, { onConflict: 'id' })

        if (error) {
            throw new Error(error.message)
        }
    }

    return { levelsById, failures }
}

function pointercrateListItemChanged(existingItem: any, nextRow: CustomListLevelInsert) {
    return !existingItem.accepted
        || Number(existingItem.position ?? 0) !== Number(nextRow.position ?? 0)
        || (existingItem.minProgress ?? null) !== (nextRow.minProgress ?? null)
        || (existingItem.videoID ?? null) !== (nextRow.videoID ?? null)
}

async function syncPointercrateListedDemonsToMirrorList(list: CustomList, actorUid: string, demons: PointercrateListedDemon[]) {
    const uniqueDemons = getUniquePointercrateDemons(demons)
    const { levelsById, failures: levelFailures } = await ensurePointercrateMirrorLevels(uniqueDemons)
    const failures: PointercrateMirrorCrawlFailure[] = []
    const processableDemons: PointercrateListedDemon[] = []

    for (const demon of uniqueDemons) {
        const levelFailure = levelFailures.get(demon.level_id)

        if (levelFailure) {
            failures.push({
                levelId: demon.level_id,
                position: demon.position,
                name: demon.name,
                error: levelFailure
            })
            continue
        }

        const level = levelsById.get(demon.level_id)

        if (!level) {
            failures.push({
                levelId: demon.level_id,
                position: demon.position,
                name: demon.name,
                error: 'Level metadata is unavailable'
            })
            continue
        }

        try {
            assertLevelTypeMatchesList(list, level)
        } catch (error) {
            failures.push({
                levelId: demon.level_id,
                position: demon.position,
                name: demon.name,
                error: getErrorMessage(error, 'This level cannot be added to this list type')
            })
            continue
        }

        processableDemons.push(demon)
    }

    const processableLevelIds = processableDemons.map((demon) => demon.level_id)
    let existingItemsByLevelId = new Map<number, any>()

    if (processableLevelIds.length) {
        const { data: existingItems, error: existingItemsError } = await supabase
            .from('listLevels')
            .select('id, levelId, addedBy, accepted, position, minProgress, videoID, rating')
            .eq('listId', list.id)
            .in('levelId', processableLevelIds)

        if (existingItemsError) {
            throw new Error(existingItemsError.message)
        }

        existingItemsByLevelId = new Map((existingItems || []).map((item) => [Number(item.levelId), item]))
    }

    const changedRows: CustomListLevelInsert[] = []
    let inserted = 0
    let updated = 0
    let unchanged = 0

    for (const demon of processableDemons) {
        let minProgress: number | null = null

        try {
            minProgress = demon.requirement == null
                ? null
                : sanitizeMinProgress(demon.requirement, false)
        } catch (error) {
            failures.push({
                levelId: demon.level_id,
                position: demon.position,
                name: demon.name,
                error: getErrorMessage(error, 'Invalid Pointercrate minimum progress')
            })
            continue
        }

        const existingItem = existingItemsByLevelId.get(demon.level_id)
        const nextRow: CustomListLevelInsert = {
            ...(existingItem ? { id: existingItem.id } : {}),
            listId: list.id,
            levelId: demon.level_id,
            addedBy: existingItem?.addedBy || actorUid,
            accepted: true,
            position: demon.position,
            minProgress,
            videoID: getPointercrateDemonVideoID(demon),
            rating: Number.isFinite(Number(existingItem?.rating)) ? Number(existingItem.rating) : 5
        }

        if (!existingItem) {
            inserted += 1
            changedRows.push(nextRow)
            continue
        }

        if (pointercrateListItemChanged(existingItem, nextRow)) {
            updated += 1
            changedRows.push(nextRow)
            continue
        }

        unchanged += 1
    }

    if (changedRows.length) {
        const { error } = await supabase
            .from('listLevels')
            .upsert(changedRows as any, { onConflict: 'listId,levelId' })

        if (error) {
            throw new Error(error.message)
        }

        await syncLevelCount(list.id)
    }

    return {
        processed: uniqueDemons.length,
        inserted,
        updated,
        unchanged,
        failed: failures.length,
        failures,
        sourceLevelIds: uniqueDemons.map((demon) => demon.level_id)
    }
}

async function removePointercrateMirrorStaleLevels(listId: number, sourceLevelIds: number[]) {
    const sourceLevelIdSet = new Set(sourceLevelIds)
    const { data: existingItems, error: existingItemsError } = await supabase
        .from('listLevels')
        .select('levelId')
        .eq('listId', listId)
        .eq('accepted', true)

    if (existingItemsError) {
        throw new Error(existingItemsError.message)
    }

    const staleLevelIds = (existingItems || [])
        .map((item) => Number(item.levelId))
        .filter((levelId) => Number.isInteger(levelId) && !sourceLevelIdSet.has(levelId))

    if (!staleLevelIds.length) {
        return 0
    }

    const { error } = await supabase
        .from('listLevels')
        .delete()
        .eq('listId', listId)
        .in('levelId', staleLevelIds)

    if (error) {
        throw new Error(error.message)
    }

    return staleLevelIds.length
}

export async function crawlPointercrateMirrorListPage(listId: number, actor: CustomListActor, options: {
    after?: unknown
    limit?: unknown
} = {}) {
    const list = await getCustomListRow(listId)
    const access = await assertCanEditListLevels(list, actor)
    assertPointercrateMirrorListConfig(list)

    const after = sanitizePointercrateMirrorCrawlAfter(options.after)
    const limit = sanitizePointercrateMirrorCrawlLimit(options.limit)
    const page = await fetchPointercrateListedDemonsPage({ after, limit })
    const summary = await syncPointercrateListedDemonsToMirrorList(list, access.actorUid ?? getRequiredActorUid(actor), page.demons)

    return {
        source: {
            name: 'pointercrate',
            mirrorListId: POINTERCRATE_MIRROR_LIST_ID,
            after: page.after,
            limit: page.limit,
            nextAfter: page.nextAfter,
            hasMore: page.hasMore,
            fetched: page.demons.length
        },
        ...summary
    }
}

export async function finalizePointercrateMirrorListCrawl(listId: number, actor: CustomListActor, payload: {
    sourceLevelIds?: unknown
    summary?: unknown
} = {}) {
    const list = await getCustomListRow(listId)
    const access = await assertCanEditListLevels(list, actor)
    assertPointercrateMirrorListConfig(list)

    const sourceLevelIds = sanitizePointercrateMirrorSourceLevelIds(payload.sourceLevelIds)
    const counters = sanitizePointercrateMirrorCrawlCounters(payload.summary)
    const removed = await removePointercrateMirrorStaleLevels(list.id, sourceLevelIds)

    await syncLevelCount(list.id)
    await appendCustomListAuditLog(list.id, {
        actorUid: access.actorUid,
        action: 'pointercrate_mirror_crawled',
        metadata: {
            source: 'pointercrate',
            mirrorListId: POINTERCRATE_MIRROR_LIST_ID,
            sourceLevelCount: sourceLevelIds.length,
            processed: counters.processed,
            inserted: counters.inserted,
            updated: counters.updated,
            unchanged: counters.unchanged,
            failed: counters.failed,
            removed
        }
    })

    return {
        removed,
        list: await getCustomList(list.id, actor)
    }
}

export async function getOwnCustomLists(ownerId: string) {
    const [{ data: ownedLists, error: ownedError }, { data: memberships, error: membershipsError }] = await Promise.all([
        supabase
            .from('lists')
            .select(`*, ownerData:players!lists_owner_fkey(${playerSelect})`)
            .eq('owner', ownerId)
            .order('updated_at', { ascending: false }),
        supabase
            .from('listMembers')
            .select('listId, role')
            .eq('uid', ownerId)
    ])

    if (ownedError) {
        throw new Error(ownedError.message)
    }

    if (membershipsError) {
        throw new Error(membershipsError.message)
    }

    const owned = (ownedLists || []) as CustomListWithOwnerData[]
    const membershipEntries = (memberships || []) as Array<Pick<CustomListMember, 'listId' | 'role'>>
    const ownedIds = new Set(owned.map((list) => list.id))
    const collaboratorListIds = membershipEntries
        .map((entry) => entry.listId)
        .filter((listId) => !ownedIds.has(listId))
    let collaboratorLists: CustomListWithOwnerData[] = []

    if (collaboratorListIds.length) {
        const { data, error } = await supabase
            .from('lists')
            .select(`*, ownerData:players!lists_owner_fkey(${playerSelect})`)
            .in('id', collaboratorListIds)

        if (error) {
            throw new Error(error.message)
        }

        collaboratorLists = (data || []) as CustomListWithOwnerData[]
    }

    const allListsById = new Map<number, CustomListWithOwnerData>()

    for (const list of [...owned, ...collaboratorLists]) {
        allListsById.set(list.id, list)
    }

    const membershipRolesByListId = new Map<number, CustomListMemberRole>()

    for (const entry of membershipEntries) {
        if (entry.role === 'admin' || entry.role === 'helper') {
            membershipRolesByListId.set(entry.listId, entry.role)
        }
    }

    const enriched = await enrichListsWithStars([...allListsById.values()], ownerId)

    return enriched
        .map((list) => {
            const access: CustomListAccessContext = {
                actorUid: ownerId,
                isModerator: false,
                isOwner: list.owner === ownerId,
                memberRole: list.owner === ownerId ? null : membershipRolesByListId.get(list.id) || null,
                pendingInvitation: null
            }

            return {
                ...list,
                rankBadges: normalizeRankBadges((list as any).rankBadges),
                currentUserRole: resolveCustomListRole(access),
                permissions: getCustomListPermissions(list as CustomList, access)
            }
        })
        .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())
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

export async function getPlayerRankedLists(uid: string): Promise<PlayerRankedListSummary[]> {
    const { data: entryRows, error: entriesError } = await (supabase as any)
        .from('listLeaderboardEntries')
        .select('listId, rank, score, completedCount')
        .eq('uid', uid)

    if (entriesError) {
        throw new Error(entriesError.message)
    }

    const entries = (entryRows || []) as Array<{
        listId: number
        rank: number
        score: number
        completedCount: number
    }>

    if (!entries.length) {
        return []
    }

    const listIds = [...new Set(entries.map((entry) => entry.listId))]
    const [{ data: lists, error: listsError }, { data: refreshRows, error: refreshError }] = await Promise.all([
        (supabase as any)
            .from('lists')
            .select('id, slug, title, isOfficial, isVerified, mode, isPlatformer, rankBadges, visibility, leaderboardEnabled')
            .in('id', listIds)
            .eq('visibility', 'public')
            .eq('leaderboardEnabled', true)
            .or('isOfficial.eq.true,isVerified.eq.true'),
        (supabase as any)
            .from('listLeaderboardRefreshes')
            .select('listId, lastRefreshedAt')
            .in('listId', listIds)
    ])

    if (listsError) {
        throw new Error(listsError.message)
    }

    if (refreshError) {
        throw new Error(refreshError.message)
    }

    const refreshByListId = new Map<number, string | null>()

    for (const refreshRow of refreshRows || []) {
        refreshByListId.set(refreshRow.listId, refreshRow.lastRefreshedAt ?? null)
    }

    const officialListOrder = new Map(OFFICIAL_LIST_SLUGS.map((slug, index) => [slug, index]))
    const listsById = new Map<number, any>()

    for (const list of lists || []) {
        listsById.set(list.id, list)
    }

    return entries
        .map((entry) => {
            const list = listsById.get(entry.listId)

            if (!list) {
                return null
            }

            return {
                id: list.id,
                slug: list.slug,
                identifier: list.slug || String(list.id),
                title: list.title,
                isOfficial: Boolean(list.isOfficial),
                isVerified: Boolean(list.isVerified),
                mode: list.mode,
                isPlatformer: Boolean(list.isPlatformer),
                rank: entry.rank,
                score: entry.score,
                completedCount: entry.completedCount,
                lastRefreshedAt: refreshByListId.get(list.id) ?? null,
                rankBadges: normalizeRankBadges(list.rankBadges)
            } satisfies PlayerRankedListSummary
        })
        .filter((entry): entry is PlayerRankedListSummary => Boolean(entry))
        .sort((left, right) => {
            if (left.isOfficial !== right.isOfficial) {
                return left.isOfficial ? -1 : 1
            }

            if (left.isOfficial && right.isOfficial) {
                const leftOrder = left.slug ? (officialListOrder.get(left.slug as OfficialListSlug) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER
                const rightOrder = right.slug ? (officialListOrder.get(right.slug as OfficialListSlug) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER

                if (leftOrder !== rightOrder) {
                    return leftOrder - rightOrder
                }
            }

            return left.title.localeCompare(right.title, 'en', { sensitivity: 'base' })
        })
}

export async function browseLists(options: {
    limit?: number
    offset?: number
    search?: string
    searchType?: string
    viewerId?: string
    kind?: 'custom' | 'official' | 'verified' | 'mirror'
}) {
    const {
        limit = 24,
        offset = 0,
        search = '',
        searchType,
        viewerId,
        kind
    } = options

    const searchParams = buildFullTextSearchParams(search, searchType)
    const normalizedSearch = normalizeFullTextSearchQuery(search)
    const normalizedSyntheticSearch = normalizedSearch.toLowerCase()

    let query = supabase
        .from('lists')
        .select(`*, ownerData:players!lists_owner_fkey(${playerSelect})`, { count: 'exact' })
        .eq('visibility', 'public')

    if (kind === 'custom') {
        query = query.eq('isOfficial', false)
    } else if (kind === 'official') {
        query = query.eq('isOfficial', true)
    } else if (kind === 'verified') {
        query = query.eq('isVerified', true)
    } else if (kind === 'mirror') {
        query = query.or(`isMirror.eq.true,id.eq.${POINTERCRATE_MIRROR_LIST_ID}`)
    }

    if (searchParams) {
        query = query.textSearch('fts', searchParams.query, searchParams.options)
    }

    let orderedQuery = query
        .order('isOfficial', { ascending: false })
        .order('updated_at', { ascending: false })

    if (kind !== 'mirror') {
        orderedQuery = orderedQuery.range(0, offset + limit - 1)
    }

    const { data, error, count } = await orderedQuery

    if (error) {
        throw new Error(error.message)
    }

    let databaseLists = await enrichListsWithStars((data || []) as CustomListWithOwnerData[], viewerId)

    if (kind === 'mirror') {
        databaseLists = databaseLists.sort((left, right) => {
            const leftIsPointercrateMirror = left.id === POINTERCRATE_MIRROR_LIST_ID
            const rightIsPointercrateMirror = right.id === POINTERCRATE_MIRROR_LIST_ID

            if (leftIsPointercrateMirror !== rightIsPointercrateMirror) {
                return leftIsPointercrateMirror ? -1 : 1
            }

            return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
        })
    }
    const databaseOfficialSlugs = new Set(
        databaseLists
            .map((list) => list.slug)
            .filter((slug): slug is OfficialListSlug => Boolean(slug) && isOfficialListSlug(slug!))
    )
    const syntheticOfficialLists = await Promise.all(
        kind === 'custom' || kind === 'verified' || kind === 'mirror'
            ? []
            : OFFICIAL_LIST_SLUGS
                .filter((slug) => !databaseOfficialSlugs.has(slug))
                .filter((slug) => {
                    if (!normalizedSyntheticSearch.length) {
                        return true
                    }

                    const entry = getOfficialListConfig(slug)
                    return entry.title.toLowerCase().includes(normalizedSyntheticSearch)
                        || entry.description.toLowerCase().includes(normalizedSyntheticSearch)
                })
                .map((slug) => getOfficialListSummary(slug))
    )
    const combinedLists = kind === 'custom' || kind === 'verified' || kind === 'mirror'
        ? databaseLists
        : [...syntheticOfficialLists, ...databaseLists]

    return {
        data: combinedLists.slice(offset, offset + limit),
        total: syntheticOfficialLists.length + (count || 0)
    }
}

export async function getCustomList(listId: CustomListIdentifier, viewerId?: CustomListActor, options: {
    itemsStart?: number
    itemsEnd?: number
    itemSort?: unknown
    itemFilters?: CustomListItemFilters
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
        const access = await assertReadable(list, viewerId)
        const permissions = getCustomListPermissions(list, access)
        const effectiveItemSort = options.itemSort !== undefined
            ? sanitizeCustomListItemSort(options.itemSort)
            : (CUSTOM_LIST_ITEM_SORT_VALUES.has(list.itemSort) ? list.itemSort as 'mode_default' | 'created_at' : 'mode_default')
        const [items, [{ starCount = 0, starred = false } = { starCount: 0, starred: false }], latestRefresh, members, auditLog, pendingInvitations, pendingInvitation] = await Promise.all([
            enrichItemsWithViewerEligibleRecords(
                await getCustomListItems(list.id, list.mode, itemRange, effectiveItemSort, options.itemFilters),
                list,
                actorUid
            ),
            enrichListsWithStars([list], actorUid),
            getLatestCustomListLeaderboardRefresh(list.id),
            permissions.canViewMembers ? getCustomListMembers(list.id) : Promise.resolve([] as CustomListMemberWithPlayerData[]),
            permissions.canViewAudit ? getCustomListAuditLog(list.id) : Promise.resolve([] as CustomListAuditLogWithPlayerData[]),
            permissions.canViewPendingInvitations ? getCustomListInvitations(list.id) : Promise.resolve([] as CustomListInvitationWithPlayerData[]),
            permissions.canRespondToInvitation ? hydrateCustomListInvitation(access.pendingInvitation) : Promise.resolve(null)
        ])

        return {
            ...list,
            itemSort: effectiveItemSort,
            rankBadges: normalizeRankBadges(list.rankBadges),
            starCount,
            starred,
            lastRefreshedAt: latestRefresh?.lastRefreshedAt ?? null,
            leaderboardTotalPlayers: latestRefresh?.totalPlayers ?? 0,
            leaderboardTotalRecords: latestRefresh?.totalRecords ?? 0,
            currentUserRole: resolveCustomListRole(access),
            permissions,
            members,
            pendingInvitations,
            pendingInvitation,
            auditLog,
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

async function getCustomListSummary(identifier: CustomListIdentifier, viewerId?: CustomListActor) {
    const actorUid = getActorUid(viewerId)

    try {
        const resolved = await resolveCustomListIdentifier(identifier)
        const access = await assertReadable(resolved, viewerId)

        const list = await getListWithOwnerData(resolved.id)
        const [[{ starCount = 0, starred = false } = { starCount: 0, starred: false }], latestRefresh] = await Promise.all([
            enrichListsWithStars([list], actorUid),
            getLatestCustomListLeaderboardRefresh(list.id)
        ])

        return {
            ...list,
            rankBadges: normalizeRankBadges(list.rankBadges),
            starCount,
            starred,
            lastRefreshedAt: latestRefresh?.lastRefreshedAt ?? null,
            leaderboardTotalPlayers: latestRefresh?.totalPlayers ?? 0,
            leaderboardTotalRecords: latestRefresh?.totalRecords ?? 0,
            currentUserRole: resolveCustomListRole(access),
            permissions: getCustomListPermissions(list, access)
        }
    } catch (error) {
        if (error instanceof NotFoundError && typeof identifier === 'string') {
            const normalizedIdentifier = identifier.trim().toLowerCase()

            if (isOfficialListSlug(normalizedIdentifier)) {
                return getOfficialListSummary(normalizedIdentifier)
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

    const list = await getCustomListSummary(identifier, viewerId)

    if (list.id <= 0) {
        return {
            list,
            data: [],
            total: 0,
            lastRefreshedAt: null
        }
    }

    if ((list as any).leaderboardEnabled === false) {
        return {
            list,
            data: [],
            total: 0,
            lastRefreshedAt: (list as any).lastRefreshedAt ?? null
        }
    }

    const totalPlayers = Number((list as any).leaderboardTotalPlayers ?? 0)
    const lastRefreshedAt = (list as any).lastRefreshedAt ?? null

    if (!lastRefreshedAt) {
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
        total: totalPlayers,
        lastRefreshedAt
    }
}

export async function getCustomListRecordPoints(identifier: CustomListIdentifier, options: {
    start?: number
    end?: number
    viewerId?: CustomListActor
    uid?: string
    ignoreRecordSettings?: boolean
} = {}) {
    const {
        start = 0,
        end = 49,
        viewerId,
        uid,
        ignoreRecordSettings = false
    } = options

    const list = await getCustomListSummary(identifier, viewerId)

    if (ignoreRecordSettings && uid && list.id > 0) {
        return getCustomListAcceptedPlayerRecords(list, { start, end, uid })
    }

    if (list.id <= 0 || (list as any).leaderboardEnabled === false) {
        return {
            list,
            data: [],
            total: 0,
            lastRefreshedAt: (list as any).lastRefreshedAt ?? null
        }
    }

    const lastRefreshedAt = (list as any).lastRefreshedAt ?? null

    if (!lastRefreshedAt) {
        return {
            list,
            data: [],
            total: 0,
            lastRefreshedAt: null
        }
    }

    let entriesQuery = (supabase as any)
        .from('listLeaderboardRecordEntries')
        .select('uid, levelId, point, no')
        .eq('listId', list.id)
        .order('no', { ascending: true })

    if (uid) {
        entriesQuery = entriesQuery.eq('uid', uid)
    }

    const [entriesResult, playerEntryResult] = await Promise.all([
        entriesQuery.range(start, end),
        uid
            ? (supabase as any)
                .from('listLeaderboardEntries')
                .select('completedCount')
                .eq('listId', list.id)
                .eq('uid', uid)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null })
    ])

    const { data: entryRows, error: entriesError } = entriesResult

    if (entriesError) {
        throw new Error(entriesError.message)
    }

    if (playerEntryResult.error) {
        throw new Error(playerEntryResult.error.message)
    }

    const entries = (entryRows || []) as CustomListLeaderboardRecordEntry[]
    const uids = [...new Set(entries.map((entry) => entry.uid))]
    const levelIds = [...new Set(entries.map((entry) => entry.levelId))]
    const playersByUid = new Map<string, any>()
    const levelsById = new Map<number, any>()
    const itemByLevelId = new Map<number, { item: any; index: number }>()
    const recordsByKey = new Map<string, {
        id: number | null
        progress: number
        timestamp: number | null
        mobile: boolean
        refreshRate: number | null
        acceptedManually: boolean
        acceptedAuto: boolean
    }>()

    const [playersResult, levelsResult, itemsResult] = await Promise.all([
        uids.length
            ? supabase
                .from('players')
                .select(`${playerSelect}`)
                .in('uid', uids)
            : Promise.resolve({ data: [], error: null }),
        levelIds.length
            ? supabase
                .from('levels')
                .select('id, name, creator, difficulty, isPlatformer, rating, minProgress, videoID')
                .in('id', levelIds)
            : Promise.resolve({ data: [], error: null }),
        levelIds.length
            ? supabase
                .from('listLevels')
                .select('id, levelId, rating, position, minProgress, videoID')
                .eq('listId', list.id)
                .eq('accepted', true)
                .in('levelId', levelIds)
            : Promise.resolve({ data: [], error: null })
    ])

    if (playersResult.error) {
        throw new Error(playersResult.error.message)
    }

    if (levelsResult.error) {
        throw new Error(levelsResult.error.message)
    }

    if (itemsResult.error) {
        throw new Error(itemsResult.error.message)
    }

    for (const player of playersResult.data || []) {
        playersByUid.set(player.uid, player)
    }

    for (const level of levelsResult.data || []) {
        levelsById.set(level.id, level)
    }

    for (const item of itemsResult.data || []) {
        itemByLevelId.set(item.levelId, {
            item: {
                ...item,
                level: levelsById.get(item.levelId) || null
            },
            index: 0
        })
    }

    if (entries.length) {
        const recordFilters = entries
            .map((entry) => `and(userid.eq.${entry.uid},levelid.eq.${entry.levelId},or(acceptedManually.eq.true,acceptedAuto.eq.true))`)
            .join(',')

        const { data: recordRows, error: recordsError } = await supabase
            .from('records')
            .select('id, userid, levelid, progress, timestamp, mobile, refreshRate, acceptedManually, acceptedAuto')
            .or(recordFilters)

        if (recordsError) {
            throw new Error(recordsError.message)
        }

        for (const record of recordRows || []) {
            if (!isCustomListRecordEligibleForFilters(record, list)) {
                continue
            }

            const itemData = itemByLevelId.get(record.levelid)
            const key = `${record.userid}:${record.levelid}`
            const recordSnapshot = {
                id: Number.isFinite(Number(record.id)) ? Number(record.id) : null,
                progress: Number(record.progress) || 0,
                timestamp: Number.isFinite(Number(record.timestamp)) ? Number(record.timestamp) : null,
                mobile: Boolean(record.mobile),
                refreshRate: Number.isFinite(Number(record.refreshRate)) ? Number(record.refreshRate) : null,
                acceptedManually: Boolean(record.acceptedManually),
                acceptedAuto: Boolean(record.acceptedAuto)
            }
            const existingSnapshot = recordsByKey.get(key)

            if (!itemData || isBetterRecordForListItem(recordSnapshot, existingSnapshot, itemData.item, list.isPlatformer)) {
                recordsByKey.set(key, recordSnapshot)
            }
        }
    }

    const totalRecords = uid
        ? Number(playerEntryResult.data?.completedCount ?? 0)
        : Number((list as any).leaderboardTotalRecords ?? 0)

    return {
        list,
        data: entries.map((entry) => {
            const recordSnapshot = recordsByKey.get(`${entry.uid}:${entry.levelId}`) || {
                id: null,
                progress: 0,
                timestamp: null,
                mobile: false,
                refreshRate: null,
                acceptedManually: false,
                acceptedAuto: false
            }
            const itemData = itemByLevelId.get(entry.levelId)

            return {
                ...entry,
                ...recordSnapshot,
                player: playersByUid.get(entry.uid) || null,
                level: levelsById.get(entry.levelId) || null,
                formulaScope: {
                    position: entry.no,
                    levelCount: Number(list.levelCount ?? 0),
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
        total: totalRecords,
        lastRefreshedAt
    }
}

export async function getRecordPublicListStats(record: {
    id?: number | null
    userid?: string | null
    levelid?: number | null
    progress?: number | null
    acceptedManually?: boolean | null
    acceptedAuto?: boolean | null
    mobile?: boolean | null
    refreshRate?: number | null
    levels?: {
        id?: number | null
        rating?: number | null
        minProgress?: number | null
        isPlatformer?: boolean | null
    } | null
}) {
    const recordId = Number(record.id)
    const uid = typeof record.userid === 'string' ? record.userid : ''
    const levelId = Number(record.levelid)

    if (!Number.isFinite(recordId) || !uid || !Number.isFinite(levelId)) {
        return []
    }

    if (!record.acceptedManually && !record.acceptedAuto) {
        return []
    }

    const { data: entryRows, error: entriesError } = await (supabase as any)
        .from('listLeaderboardRecordEntries')
        .select('listId, uid, levelId, point, no')
        .eq('uid', uid)
        .eq('levelId', levelId)

    if (entriesError) {
        throw new Error(entriesError.message)
    }

    const entries = entryRows || []
    const listIds = [...new Set(entries.map((entry: any) => Number(entry.listId)).filter(Number.isFinite))]

    if (!listIds.length) {
        return []
    }

    const [listsResult, itemsResult, recordsResult] = await Promise.all([
        (supabase as any)
            .from('lists')
            .select('id, slug, title, mode, isPlatformer, isOfficial, isVerified, topEnabled, visibility, leaderboardEnabled, recordFilterPlatform, recordFilterMinRefreshRate, recordFilterMaxRefreshRate, recordFilterAcceptanceStatus, recordFilterManualAcceptanceOnly')
            .eq('visibility', 'public')
            .in('id', listIds),
        (supabase as any)
            .from('listLevels')
            .select('listId, levelId, rating, position, minProgress, videoID')
            .eq('levelId', levelId)
            .eq('accepted', true)
            .in('listId', listIds),
        (supabase as any)
            .from('records')
            .select('id, userid, levelid, progress, timestamp, mobile, refreshRate, acceptedManually, acceptedAuto')
            .eq('userid', uid)
            .eq('levelid', levelId)
            .or('acceptedManually.eq.true,acceptedAuto.eq.true')
    ])

    if (listsResult.error) {
        throw new Error(listsResult.error.message)
    }

    if (itemsResult.error) {
        throw new Error(itemsResult.error.message)
    }

    if (recordsResult.error) {
        throw new Error(recordsResult.error.message)
    }

    const listsById = new Map<number, any>((listsResult.data || [])
        .filter((list: any) => list.leaderboardEnabled !== false)
        .map((list: any) => [Number(list.id), list]))
    const itemsByListId = new Map<number, any>((itemsResult.data || []).map((item: any) => [Number(item.listId), item]))
    const acceptedRecords = recordsResult.data || []
    const level = {
        id: levelId,
        rating: record.levels?.rating ?? null,
        minProgress: record.levels?.minProgress ?? null,
        isPlatformer: record.levels?.isPlatformer ?? null
    }
    const stats: any[] = []

    for (const entry of entries) {
        const list = listsById.get(Number(entry.listId))
        const itemRow = itemsByListId.get(Number(entry.listId))

        if (!list || !itemRow) {
            continue
        }

        const item = {
            ...itemRow,
            level
        }
        let bestRecord: any = null

        for (const candidate of acceptedRecords) {
            if (!isCustomListRecordEligibleForFilters(candidate, list)) {
                continue
            }

            if (!isEligibleRecordForListItem(candidate, item, Boolean(list.isPlatformer), {
                ignorePlatformerMinProgress: Boolean(list.isPlatformer)
            })) {
                continue
            }

            if (isBetterRecordForListItem(candidate, bestRecord, item, Boolean(list.isPlatformer))) {
                bestRecord = candidate
            }
        }

        if (!bestRecord || Number(bestRecord.id) !== recordId) {
            continue
        }

        stats.push({
            list: {
                id: Number(list.id),
                slug: list.slug ?? null,
                title: list.title,
                mode: list.mode,
                isPlatformer: Boolean(list.isPlatformer),
                isOfficial: Boolean(list.isOfficial),
                isVerified: Boolean(list.isVerified),
                topEnabled: Boolean(list.topEnabled)
            },
            point: Number(entry.point) || 0,
            no: Number(entry.no) || 0,
            item: {
                position: item.position ?? null,
                rating: item.rating ?? record.levels?.rating ?? null,
                minProgress: getEffectiveMinProgress(item)
            }
        })
    }

    return stats.sort((left, right) => {
        const officialDiff = Number(right.list.isOfficial) - Number(left.list.isOfficial)
        const verifiedDiff = Number(right.list.isVerified) - Number(left.list.isVerified)

        return officialDiff || verifiedDiff || left.list.title.localeCompare(right.list.title)
    })
}

async function getAcceptedRecordsForListLevels(uid: string, levelIds: number[]) {
    const records: any[] = []

    for (let levelStart = 0; levelStart < levelIds.length; levelStart += CUSTOM_LIST_LEADERBOARD_PLAYER_BATCH_SIZE) {
        const levelBatch = levelIds.slice(levelStart, levelStart + CUSTOM_LIST_LEADERBOARD_PLAYER_BATCH_SIZE)

        if (!levelBatch.length) {
            continue
        }

        for (let recordStart = 0; ; recordStart += CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE) {
            const recordEnd = recordStart + CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE - 1
            const { data, error } = await supabase
                .from('records')
                .select('id, userid, levelid, progress, timestamp, mobile, refreshRate, acceptedManually, acceptedAuto')
                .eq('userid', uid)
                .in('levelid', levelBatch)
                .or('acceptedManually.eq.true,acceptedAuto.eq.true')
                .order('acceptedManually', { ascending: false, nullsFirst: false })
                .order('acceptedAuto', { ascending: false })
                .order('timestamp', { ascending: false, nullsFirst: false })
                .range(recordStart, recordEnd)

            if (error) {
                throw new Error(error.message)
            }

            if (!data?.length) {
                break
            }

            records.push(...data)

            if (data.length < CUSTOM_LIST_LEADERBOARD_RECORD_PAGE_SIZE) {
                break
            }
        }
    }

    return records
}

async function getCustomListLeaderboardRecordEntryReferences(listId: number, uid: string) {
    const entriesByKey = new Map<string, CustomListLeaderboardRecordEntryReference>()

    if (listId <= 0) {
        return entriesByKey
    }

    const { data, error } = await (supabase as any)
        .from('listLeaderboardRecordEntries')
        .select('uid, levelId, point, no')
        .eq('listId', listId)
        .eq('uid', uid)

    if (error) {
        throw new Error(error.message)
    }

    for (const entry of data || []) {
        entriesByKey.set(`${entry.uid}:${entry.levelId}`, {
            point: Number(entry.point) || 0,
            no: Number(entry.no) || 0
        })
    }

    return entriesByKey
}

async function getCustomListAcceptedPlayerRecords(
    list: Awaited<ReturnType<typeof getCustomListSummary>>,
    options: {
        start: number
        end: number
        uid: string
    }
) {
    const effectiveItemSort = CUSTOM_LIST_ITEM_SORT_VALUES.has((list as any).itemSort)
        ? (list as any).itemSort as 'mode_default' | 'created_at'
        : 'mode_default'
    const items = await getCustomListItems(list.id, list.mode, undefined, effectiveItemSort)
    const itemByLevelId = new Map(items.map((item: any, index: number) => [item.levelId, { item, index }]))
    const levelIds = [...itemByLevelId.keys()]

    if (!levelIds.length) {
        return {
            list,
            data: [],
            total: 0,
            lastRefreshedAt: (list as any).lastRefreshedAt ?? null
        }
    }

    const [records, playersByUid, leaderboardRecordEntriesByKey] = await Promise.all([
        getAcceptedRecordsForListLevels(options.uid, levelIds),
        fetchCustomListLeaderboardPlayers([options.uid]),
        getCustomListLeaderboardRecordEntryReferences(list.id, options.uid)
    ])
    const player = playersByUid.get(options.uid) || null
    const isTop = list.mode === 'top'
    const entries = records
        .map((record) => {
            const itemData = itemByLevelId.get(record.levelid)

            return itemData ? { record, itemData } : null
        })
        .filter((entry): entry is { record: any; itemData: { item: any; index: number } } => Boolean(entry))
        .sort((left, right) => {
            if (isTop) {
                const leftPosition = getNormalizedListPosition(left.itemData.item, left.itemData.index, list.id < 0)
                const rightPosition = getNormalizedListPosition(right.itemData.item, right.itemData.index, list.id < 0)

                if (leftPosition !== rightPosition) {
                    return leftPosition - rightPosition
                }
            } else {
                const leftRating = Number(left.itemData.item.rating ?? left.itemData.item.level?.rating ?? 0)
                const rightRating = Number(right.itemData.item.rating ?? right.itemData.item.level?.rating ?? 0)

                if (leftRating !== rightRating) {
                    return rightRating - leftRating
                }
            }

            const acceptanceDiff = getRecordAcceptancePriority(right.record) - getRecordAcceptancePriority(left.record)

            if (acceptanceDiff !== 0) {
                return acceptanceDiff
            }

            return Number(right.record.timestamp ?? 0) - Number(left.record.timestamp ?? 0)
        })
        .map(({ record, itemData }) => {
            const leaderboardRecordEntry = leaderboardRecordEntriesByKey.get(`${record.userid}:${record.levelid}`)
            const no = leaderboardRecordEntry?.no ?? null
            const point = leaderboardRecordEntry?.point ?? null
            const progress = Number(record.progress) || 0

            return {
                uid: record.userid,
                levelId: record.levelid,
                point,
                no,
                id: Number.isFinite(Number(record.id)) ? Number(record.id) : null,
                progress,
                timestamp: Number.isFinite(Number(record.timestamp)) ? Number(record.timestamp) : null,
                mobile: Boolean(record.mobile),
                refreshRate: Number.isFinite(Number(record.refreshRate)) ? Number(record.refreshRate) : null,
                acceptedManually: Boolean(record.acceptedManually),
                acceptedAuto: Boolean(record.acceptedAuto),
                player,
                level: itemData.item.level || null,
                formulaScope: {
                    position: no ?? 0,
                    levelCount: items.length,
                    top: getNormalizedListPosition(itemData.item, itemData.index, list.id < 0),
                    rating: Number(itemData.item.rating ?? itemData.item.level?.rating ?? 0),
                    minProgress: Number(getEffectiveMinProgress(itemData.item) ?? 0),
                    progress
                }
            }
        })

    return {
        list,
        data: entries.slice(options.start, options.end + 1),
        total: entries.length,
        lastRefreshedAt: (list as any).lastRefreshedAt ?? null
    }
}

export async function refreshCustomListLeaderboard(identifier: CustomListIdentifier, actor: CustomListActor) {
    const resolved = await resolveCustomListIdentifier(identifier)
    const list = await getCustomListRow(resolved.id)
    await assertCanEditList(list, actor)
    const levelCount = await syncLevelCount(list.id)

    if ((list as any).leaderboardEnabled === false) {
        const refreshRow = await persistDisabledCustomListLeaderboard(list.id)

        return {
            listId: list.id,
            total: refreshRow.totalPlayers,
            totalRecords: refreshRow.totalRecords,
            levelCount,
            lastRefreshedAt: refreshRow.lastRefreshedAt
        }
    }

    const effectiveItemSort = CUSTOM_LIST_ITEM_SORT_VALUES.has(list.itemSort) ? list.itemSort as 'mode_default' | 'created_at' : 'mode_default'
    const hydratedList = {
        ...list,
        levelCount,
        itemSort: effectiveItemSort,
        items: await getCustomListItems(list.id, list.mode, undefined, effectiveItemSort)
    } as Awaited<ReturnType<typeof getCustomList>>
    const { rankedPlayers, rankedRecords } = await calculateCustomListLeaderboardSnapshot(hydratedList)
    const refreshRow = await persistCustomListLeaderboard(list.id, rankedPlayers, rankedRecords)

    return {
        listId: list.id,
        total: refreshRow.totalPlayers,
        totalRecords: refreshRow.totalRecords,
        levelCount,
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
            videoID: getEffectiveVideoID(item),
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
    await assertReadable(list, userId)

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
        .eq('accepted', true)

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
        .filter((list) => list.isOfficial || list.starCount > 0)
        .sort((left, right) => {
            if (left.isOfficial !== right.isOfficial) {
                return left.isOfficial ? -1 : 1
            }

            if (right.starCount !== left.starCount) {
                return right.starCount - left.starCount
            }

            return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
        })
        .map((list) => ({
            ...list,
            rankBadges: normalizeRankBadges(list.rankBadges),
            item: listItemsById.get(list.id) || null
        }))
}

function getOfficialLevelListEntries(level: {
    created_at?: string | null
    rating?: number | null
    flPt?: number | null
    dlTop?: number | null
    flTop?: number | null
    minProgress?: number | null
    isChallenge?: boolean | null
    isPlatformer?: boolean | null
}) {
    const createdAt = level.created_at || new Date().toISOString()
    const updatedAt = createdAt
    const entries: any[] = []

    if (level.dlTop != null) {
        if (level.isChallenge) {
            const config = getOfficialListConfig('cl')
            entries.push({
                id: -3,
                slug: config.slug,
                owner: '',
                title: config.title,
                description: config.description,
                backgroundColor: null,
                bannerUrl: null,
                borderColor: null,
                visibility: 'public',
                tags: ['official'],
                levelCount: 0,
                isPlatformer: false,
                isOfficial: true,
                communityEnabled: false,
                levelSubmissionEnabled: false,
                faviconUrl: null,
                logoUrl: null,
                topEnabled: false,
                itemSort: 'mode_default',
                mode: config.mode,
                rankBadges: [],
                recordScoreFormula: config.recordScoreFormula,
                weightFormula: config.weightFormula,
                lastRefreshedAt: null,
                updated_at: updatedAt,
                starCount: 0,
                starred: false,
                ownerData: null,
                item: {
                    created_at: createdAt,
                    rating: level.rating ?? null,
                    position: level.dlTop,
                    minProgress: level.minProgress ?? null,
                    videoID: null
                }
            })
        } else if (level.isPlatformer) {
            const config = getOfficialListConfig('pl')
            entries.push({
                id: -2,
                slug: config.slug,
                owner: '',
                title: config.title,
                description: config.description,
                backgroundColor: null,
                bannerUrl: null,
                borderColor: null,
                visibility: 'public',
                tags: ['official'],
                levelCount: 0,
                isPlatformer: true,
                isOfficial: true,
                communityEnabled: false,
                levelSubmissionEnabled: false,
                faviconUrl: null,
                logoUrl: null,
                topEnabled: true,
                itemSort: 'mode_default',
                mode: config.mode,
                rankBadges: [],
                recordScoreFormula: config.recordScoreFormula,
                weightFormula: config.weightFormula,
                lastRefreshedAt: null,
                updated_at: updatedAt,
                starCount: 0,
                starred: false,
                ownerData: null,
                item: {
                    created_at: createdAt,
                    rating: level.rating ?? null,
                    position: level.dlTop,
                    minProgress: level.minProgress ?? null,
                    videoID: null
                }
            })
        } else {
            const config = getOfficialListConfig('dl')
            entries.push({
                id: -1,
                slug: config.slug,
                owner: '',
                title: config.title,
                description: config.description,
                backgroundColor: null,
                bannerUrl: null,
                borderColor: null,
                visibility: 'public',
                tags: ['official'],
                levelCount: 0,
                isPlatformer: false,
                isOfficial: true,
                communityEnabled: false,
                levelSubmissionEnabled: false,
                faviconUrl: null,
                logoUrl: null,
                topEnabled: false,
                itemSort: 'mode_default',
                mode: config.mode,
                rankBadges: [],
                recordScoreFormula: config.recordScoreFormula,
                weightFormula: config.weightFormula,
                lastRefreshedAt: null,
                updated_at: updatedAt,
                starCount: 0,
                starred: false,
                ownerData: null,
                item: {
                    created_at: createdAt,
                    rating: level.rating ?? null,
                    position: level.dlTop,
                    minProgress: level.minProgress ?? null,
                    videoID: null
                }
            })
        }
    }

    if (level.flTop != null) {
        const config = getOfficialListConfig('fl')
        entries.push({
            id: -4,
            slug: config.slug,
            owner: '',
            title: config.title,
            description: config.description,
            backgroundColor: null,
            bannerUrl: null,
            borderColor: null,
            visibility: 'public',
            tags: ['official'],
            levelCount: 0,
            isPlatformer: Boolean(level.isPlatformer),
            isOfficial: true,
            communityEnabled: false,
            levelSubmissionEnabled: false,
            faviconUrl: null,
            logoUrl: null,
            topEnabled: true,
            itemSort: 'mode_default',
            mode: config.mode,
            rankBadges: [],
            recordScoreFormula: config.recordScoreFormula,
            weightFormula: config.weightFormula,
            lastRefreshedAt: null,
            updated_at: updatedAt,
            starCount: 0,
            starred: false,
            ownerData: null,
            item: {
                created_at: createdAt,
                rating: level.flPt ?? null,
                position: level.flTop,
                minProgress: level.minProgress ?? null,
                videoID: null
            }
        })
    }

    return entries
}

function mergeLevelListSummaries(officialLists: any[], remoteLists: any[]) {
    const remoteByKey = new Map(remoteLists.map((list) => [list.slug || String(list.id), list]))
    const mergedOfficial = officialLists.map((officialList) => {
        const key = officialList.slug || String(officialList.id)
        const remoteList = remoteByKey.get(key)

        if (!remoteList) {
            return officialList
        }

        return {
            ...officialList,
            ...remoteList,
            item: remoteList.item ?? officialList.item
        }
    })

    const seen = new Set(mergedOfficial.map((list) => list.slug || String(list.id)))
    const merged = [...mergedOfficial]

    for (const list of remoteLists) {
        const key = list.slug || String(list.id)

        if (seen.has(key)) {
            continue
        }

        seen.add(key)
        merged.push(list)
    }

    return merged
}

export async function getEligibleListsByLevel(levelId: number, progress?: number | null, viewerId?: string) {
    requireLevelId(levelId)

    const hasCandidateProgress = progress !== undefined && progress !== null
    const candidateProgress = hasCandidateProgress ? Number(progress) : null

    if (candidateProgress !== null && (!Number.isFinite(candidateProgress) || candidateProgress < 0)) {
        throw new ValidationError('Invalid progress')
    }

    const candidateRecord = candidateProgress == null ? null : { progress: candidateProgress }

    const [levelResult, listLevelsResult] = await Promise.all([
        supabase
            .from('levels')
            .select('id, created_at, rating, flPt, dlTop, flTop, minProgress, isChallenge, isPlatformer')
            .eq('id', levelId)
            .maybeSingle(),
        supabase
            .from('listLevels')
            .select('listId, created_at, rating, position, minProgress, videoID')
            .eq('levelId', levelId)
            .eq('accepted', true)
    ])

    if (levelResult.error) {
        throw new Error(levelResult.error.message)
    }

    if (listLevelsResult.error) {
        throw new Error(listLevelsResult.error.message)
    }

    const officialLists = levelResult.data
        ? getOfficialLevelListEntries(levelResult.data)
            .map((list) => ({
                ...list,
                eligible: candidateRecord
                    ? isEligibleRecordForListItem(candidateRecord, list.item, list.isPlatformer)
                    : null
            }))
        : []

    const listLevels = listLevelsResult.data || []
    const listIds = [...new Set(listLevels.map((entry) => entry.listId))]

    if (!listIds.length) {
        return officialLists
    }

    const listItemsById = new Map(listLevels.map((entry) => [entry.listId, entry]))
    const { data: lists, error: listsError } = await supabase
        .from('lists')
        .select(`*, ownerData:players!lists_owner_fkey(${playerSelect})`)
        .eq('visibility', 'public')
        .in('id', listIds)
        .order('updated_at', { ascending: false })

    if (listsError) {
        throw new Error(listsError.message)
    }

    const remoteLists = (await enrichListsWithStars((lists || []) as CustomListWithOwnerData[], viewerId))
        .map((list) => {
            const item = listItemsById.get(list.id) || null

            return {
                ...list,
                rankBadges: normalizeRankBadges((list as any).rankBadges),
                item,
                eligible: item && candidateRecord
                    ? isEligibleRecordForListItem(candidateRecord, item, list.isPlatformer)
                    : null
            }
        })

    return mergeLevelListSummaries(officialLists, remoteLists)
}

export async function createCustomList(ownerId: string, payload: {
    title: unknown
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
    slug?: unknown
    isOfficial?: unknown
    weightFormula?: unknown
    recordScoreFormula?: unknown
    rankBadges?: unknown
    itemSort?: unknown
    recordFilterPlatform?: unknown
    recordFilterMinRefreshRate?: unknown
    recordFilterMaxRefreshRate?: unknown
    recordFilterManualAcceptanceOnly?: unknown
    recordFilterAcceptanceStatus?: unknown
}) {
    const recordFilterAcceptanceStatus = payload.recordFilterAcceptanceStatus !== undefined
        ? sanitizeCustomListRecordAcceptanceStatus(payload.recordFilterAcceptanceStatus)
        : sanitizeCustomListManualAcceptanceOnly(payload.recordFilterManualAcceptanceOnly)
            ? 'manual'
            : 'any'
    const listInsert: CustomListInsert = {
        owner: ownerId,
        title: sanitizeTitle(payload.title),
        description: sanitizeDescription(payload.description),
        backgroundColor: sanitizeThemeColor(payload.backgroundColor, 'backgroundColor'),
        bannerUrl: sanitizeThemeUrl(payload.bannerUrl, 'bannerUrl'),
        borderColor: sanitizeThemeColor(payload.borderColor, 'borderColor'),
        visibility: sanitizeVisibility(payload.visibility),
        tags: sanitizeTags(payload.tags),
        mode: sanitizeMode(payload.mode),
        isPlatformer: sanitizeListPlatformer(payload.isPlatformer),
        communityEnabled: sanitizeCommunityEnabled(payload.communityEnabled),
        leaderboardEnabled: sanitizeLeaderboardEnabled(payload.leaderboardEnabled),
        faviconUrl: sanitizeThemeUrl(payload.faviconUrl, 'faviconUrl'),
        logoUrl: sanitizeThemeUrl(payload.logoUrl, 'logoUrl'),
        topEnabled: sanitizeTopEnabled(payload.topEnabled),
        levelSubmissionEnabled: sanitizeLevelSubmissionEnabled(payload.levelSubmissionEnabled),
        itemSort: sanitizeCustomListItemSort(payload.itemSort),
        recordFilterPlatform: sanitizeCustomListRecordPlatform(payload.recordFilterPlatform),
        recordFilterMinRefreshRate: sanitizeCustomListRecordRefreshRate(payload.recordFilterMinRefreshRate, 'recordFilterMinRefreshRate'),
        recordFilterMaxRefreshRate: sanitizeCustomListRecordRefreshRate(payload.recordFilterMaxRefreshRate, 'recordFilterMaxRefreshRate'),
        recordFilterAcceptanceStatus,
        recordFilterManualAcceptanceOnly: getManualAcceptanceOnlyForStatus(recordFilterAcceptanceStatus),
        slug: sanitizeSlug(payload.slug),
        isOfficial: false,
        rankBadges: sanitizeRankBadges(payload.rankBadges),
        recordScoreFormula: sanitizeRecordScoreFormula(payload.recordScoreFormula),
        weightFormula: sanitizeWeightFormula(payload.weightFormula),
        updated_at: new Date().toISOString()
    }

    if (
        listInsert.recordFilterMinRefreshRate != null
        && listInsert.recordFilterMaxRefreshRate != null
        && listInsert.recordFilterMinRefreshRate > listInsert.recordFilterMaxRefreshRate
    ) {
        throw new ValidationError('recordFilterMinRefreshRate must be less than or equal to recordFilterMaxRefreshRate')
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

    await appendCustomListAuditLog(data.id, {
        actorUid: ownerId,
        action: 'list_created',
        metadata: {
            title: data.title,
            visibility: data.visibility,
            mode: data.mode,
            isPlatformer: data.isPlatformer
        }
    })

    return getCustomList(data.id, ownerId)
}

async function buildCustomListSettingsUpdatePlan(listId: number, existing: CustomList, payload: CustomListSettingsPayload) {
    const pendingUpdates: Partial<CustomListUpdate> = {}
    const existingValues = existing as Record<string, unknown>

    if (payload.title !== undefined) {
        pendingUpdates.title = sanitizeTitle(payload.title)
    }

    if (payload.description !== undefined) {
        pendingUpdates.description = sanitizeDescription(payload.description)
    }

    if (payload.backgroundColor !== undefined) {
        pendingUpdates.backgroundColor = sanitizeThemeColor(payload.backgroundColor, 'backgroundColor')
    }

    if (payload.bannerUrl !== undefined) {
        pendingUpdates.bannerUrl = sanitizeThemeUrl(payload.bannerUrl, 'bannerUrl')
    }

    if (payload.borderColor !== undefined) {
        pendingUpdates.borderColor = sanitizeThemeColor(payload.borderColor, 'borderColor')
    }

    if (payload.visibility !== undefined) {
        const visibility = sanitizeVisibility(payload.visibility)

        if (existing.isBanned && visibility !== 'private') {
            throw new ValidationError('Banned lists must remain private')
        }

        pendingUpdates.visibility = visibility
    }

    if (payload.tags !== undefined) {
        pendingUpdates.tags = sanitizeTags(payload.tags)
    }

    if (payload.mode !== undefined) {
        pendingUpdates.mode = sanitizeMode(payload.mode)
    }

    if (payload.isPlatformer !== undefined) {
        const isPlatformer = sanitizeListPlatformer(payload.isPlatformer)

        if (isPlatformer !== existing.isPlatformer) {
            await assertExistingLevelsMatchType(listId, isPlatformer)
        }

        pendingUpdates.isPlatformer = isPlatformer
    }

    if (payload.communityEnabled !== undefined) {
        pendingUpdates.communityEnabled = sanitizeCommunityEnabled(payload.communityEnabled)
    }

    if (payload.leaderboardEnabled !== undefined) {
        pendingUpdates.leaderboardEnabled = sanitizeLeaderboardEnabled(payload.leaderboardEnabled)
    }

    if (payload.faviconUrl !== undefined) {
        pendingUpdates.faviconUrl = sanitizeThemeUrl(payload.faviconUrl, 'faviconUrl')
    }

    if (payload.logoUrl !== undefined) {
        pendingUpdates.logoUrl = sanitizeThemeUrl(payload.logoUrl, 'logoUrl')
    }

    if (payload.topEnabled !== undefined) {
        pendingUpdates.topEnabled = sanitizeTopEnabled(payload.topEnabled)
    }

    if (payload.levelSubmissionEnabled !== undefined) {
        pendingUpdates.levelSubmissionEnabled = sanitizeLevelSubmissionEnabled(payload.levelSubmissionEnabled)
    }

    if (payload.slug !== undefined) {
        const slug = sanitizeSlug(payload.slug)

        if (slug) {
            await ensureUniqueListSlug(slug, listId)
        }

        pendingUpdates.slug = slug
    }

    if (payload.weightFormula !== undefined) {
        pendingUpdates.weightFormula = sanitizeWeightFormula(payload.weightFormula)
    }

    if (payload.recordScoreFormula !== undefined) {
        pendingUpdates.recordScoreFormula = sanitizeRecordScoreFormula(payload.recordScoreFormula)
    }

    if (payload.rankBadges !== undefined) {
        pendingUpdates.rankBadges = sanitizeRankBadges(payload.rankBadges)
    }

    if (payload.itemSort !== undefined) {
        pendingUpdates.itemSort = sanitizeCustomListItemSort(payload.itemSort)
    }

    if (payload.recordFilterPlatform !== undefined) {
        pendingUpdates.recordFilterPlatform = sanitizeCustomListRecordPlatform(payload.recordFilterPlatform)
    }

    if (payload.recordFilterMinRefreshRate !== undefined) {
        pendingUpdates.recordFilterMinRefreshRate = sanitizeCustomListRecordRefreshRate(payload.recordFilterMinRefreshRate, 'recordFilterMinRefreshRate')
    }

    if (payload.recordFilterMaxRefreshRate !== undefined) {
        pendingUpdates.recordFilterMaxRefreshRate = sanitizeCustomListRecordRefreshRate(payload.recordFilterMaxRefreshRate, 'recordFilterMaxRefreshRate')
    }

    const nextMinRefreshRate = pendingUpdates.recordFilterMinRefreshRate ?? existing.recordFilterMinRefreshRate
    const nextMaxRefreshRate = pendingUpdates.recordFilterMaxRefreshRate ?? existing.recordFilterMaxRefreshRate

    if (
        nextMinRefreshRate != null
        && nextMaxRefreshRate != null
        && nextMinRefreshRate > nextMaxRefreshRate
    ) {
        throw new ValidationError('recordFilterMinRefreshRate must be less than or equal to recordFilterMaxRefreshRate')
    }

    if (payload.recordFilterAcceptanceStatus !== undefined) {
        const acceptanceStatus = sanitizeCustomListRecordAcceptanceStatus(payload.recordFilterAcceptanceStatus)

        pendingUpdates.recordFilterAcceptanceStatus = acceptanceStatus
        pendingUpdates.recordFilterManualAcceptanceOnly = getManualAcceptanceOnlyForStatus(acceptanceStatus)
    } else if (payload.recordFilterManualAcceptanceOnly !== undefined) {
        pendingUpdates.recordFilterManualAcceptanceOnly = sanitizeCustomListManualAcceptanceOnly(payload.recordFilterManualAcceptanceOnly)
        pendingUpdates.recordFilterAcceptanceStatus = pendingUpdates.recordFilterManualAcceptanceOnly ? 'manual' : 'any'
    }

    const changedEntries = (Object.entries(pendingUpdates) as Array<[string, unknown]>)
        .filter(([field, nextValue]) => !areCustomListValuesEqual(existingValues[field], nextValue))

    const updates: CustomListUpdate = {
        updated_at: new Date().toISOString()
    }
    const changes: Record<string, { old: unknown; new: unknown }> = {}

    for (const [field, nextValue] of changedEntries) {
        ;(updates as Record<string, unknown>)[field] = nextValue
        changes[field] = {
            old: normalizeCustomListAuditValue(existingValues[field]),
            new: normalizeCustomListAuditValue(nextValue)
        }
    }

    return {
        changedEntries,
        changes,
        updates
    }
}

async function applyCustomListSettingsUpdate(listId: number, existing: CustomList, access: CustomListAccessContext, payload: CustomListSettingsPayload) {
    const updatePlan = await buildCustomListSettingsUpdatePlan(listId, existing, payload)

    if (!updatePlan.changedEntries.length) {
        return {
            changed: false,
            list: existing
        }
    }

    const { error } = await supabase
        .from('lists')
        .update(updatePlan.updates)
        .eq('id', listId)

    if (error) {
        throw new Error(error.message)
    }

    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: 'list_updated',
        metadata: {
            fields: updatePlan.changedEntries.map(([field]) => field),
            changes: updatePlan.changes
        }
    })

    if (updatePlan.updates.leaderboardEnabled === false) {
        await deleteCustomListLeaderboardArtifacts(listId)
    }

    return {
        changed: true,
        list: {
            ...existing,
            ...updatePlan.updates
        } as CustomList
    }
}

export async function updateCustomList(listId: number, ownerId: CustomListActor, payload: CustomListSettingsPayload) {
    const existing = await getCustomListRow(listId)
    const access = await assertCanEditList(existing, ownerId)
    const result = await applyCustomListSettingsUpdate(listId, existing, access, payload)

    if (!result.changed) {
        return getCustomList(listId, ownerId)
    }

    return getCustomList(listId, ownerId)
}

export async function setCustomListBanState(listId: number, actor: CustomListActor, value: unknown) {
    const existing = await getCustomListRow(listId)
    const actorUid = getActorUid(actor)

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

    await appendCustomListAuditLog(listId, {
        actorUid,
        action: 'ban_state_updated',
        metadata: {
            isBanned
        }
    })

    return getCustomList(listId, actor)
}

export async function updateCustomListCollaborationSettings(listId: number, actor: CustomListActor, payload: {
    adminsCanManageHelpers?: unknown
}) {
    const list = await getCustomListRow(listId)
    const access = await assertOwnerEditable(list, actor)
    const updates: CustomListUpdate = {
        updated_at: new Date().toISOString()
    }

    if (payload.adminsCanManageHelpers !== undefined) {
        updates.adminsCanManageHelpers = sanitizeAdminsCanManageHelpers(payload.adminsCanManageHelpers)
    }

    const changedFields = Object.keys(updates).filter((field) => field !== 'updated_at')

    if (!changedFields.length) {
        return getCustomList(listId, actor)
    }

    const { error } = await supabase
        .from('lists')
        .update(updates)
        .eq('id', listId)

    if (error) {
        throw new Error(error.message)
    }

    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: 'collaboration_settings_updated',
        metadata: {
            adminsCanManageHelpers: updates.adminsCanManageHelpers
        }
    })

    return getCustomList(listId, actor)
}

export async function addCustomListMember(listId: number, actor: CustomListActor, payload: {
    uid?: unknown
    role?: unknown
}) {
    const list = await getCustomListRow(listId)
    const uid = sanitizeActorUid(payload.uid, 'member uid')
    const role = sanitizeCustomListMemberRole(payload.role)
    const access = await assertCanManageListMembers(list, actor, { targetRole: role })
    const actorUid = getRequiredActorUid(actor)

    if (uid === list.owner) {
        throw new ValidationError('The owner cannot be added as a collaborator')
    }

    await ensurePlayerExists(uid)

    const existingMember = await getCustomListMembership(listId, uid)

    if (existingMember) {
        throw new ConflictError('This player is already a collaborator on this list')
    }

    const existingInvitation = await getCustomListInvitation(listId, uid)
    const now = new Date().toISOString()

    const invitationInsert: CustomListInvitationInsert = {
        listId,
        uid,
        role,
        invitedBy: actorUid,
        created_at: existingInvitation?.created_at ?? now,
        updated_at: now
    }

    const { error } = await supabase
        .from('listInvitations')
        .upsert(invitationInsert, { onConflict: 'listId,uid' })

    if (error) {
        throw new Error(error.message)
    }

    await touchCustomListActivity(listId)
    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: existingInvitation ? 'member_invitation_updated' : 'member_invited',
        targetUid: uid,
        metadata: existingInvitation
            ? {
                fromRole: existingInvitation.role,
                toRole: role
            }
            : {
                role
            }
    })

    const inviter = await ensurePlayerExists(actorUid)
    const invitationMessage = existingInvitation
        ? `Lời mời cộng tác vào danh sách ${list.title} đã được cập nhật bởi ${inviter.name || actorUid}. Nhấn để xem và phản hồi.`
        : `Bạn đã được mời cộng tác vào danh sách ${list.title} bởi ${inviter.name || actorUid}. Nhấn để xem và phản hồi.`

    await sendNotification({
        to: uid,
        content: invitationMessage,
        redirect: buildCustomListInvitationRedirect(list)
    })

    return getCustomList(listId, actor)
}

export async function acceptCustomListInvitation(listId: number, actor: CustomListActor) {
    const list = await getCustomListRow(listId)
    const actorUid = getRequiredActorUid(actor)
    const invitation = await getCustomListInvitation(listId, actorUid)

    if (!invitation) {
        throw new NotFoundError('Pending invitation not found')
    }

    const existingMember = await getCustomListMembership(listId, actorUid)

    if (!existingMember) {
        const memberInsert: CustomListMemberInsert = {
            listId,
            uid: actorUid,
            role: invitation.role,
            addedBy: invitation.invitedBy,
            updated_at: new Date().toISOString()
        }

        const { error } = await supabase
            .from('listMembers')
            .insert(memberInsert)

        if (error) {
            throw new Error(error.message)
        }
    }

    await deleteCustomListInvitation(listId, actorUid)
    await touchCustomListActivity(listId)
    await appendCustomListAuditLog(listId, {
        actorUid,
        action: 'member_invitation_accepted',
        targetUid: actorUid,
        metadata: {
            role: invitation.role,
            invitedBy: invitation.invitedBy
        }
    })

    return getCustomList(listId, actor)
}

export async function rejectCustomListInvitation(listId: number, actor: CustomListActor) {
    const list = await getCustomListRow(listId)
    const actorUid = getRequiredActorUid(actor)
    const invitation = await getCustomListInvitation(listId, actorUid)

    if (!invitation) {
        throw new NotFoundError('Pending invitation not found')
    }

    await deleteCustomListInvitation(listId, actorUid)
    await touchCustomListActivity(listId)
    await appendCustomListAuditLog(listId, {
        actorUid,
        action: 'member_invitation_rejected',
        targetUid: actorUid,
        metadata: {
            role: invitation.role,
            invitedBy: invitation.invitedBy
        }
    })

    return {
        ok: true,
        redirect: buildCustomListInvitationRejectRedirect(list)
    }
}

export async function revokeCustomListInvitation(listId: number, actor: CustomListActor, invitationUid: unknown) {
    const list = await getCustomListRow(listId)
    const uid = sanitizeActorUid(invitationUid, 'member uid')
    const invitation = await getCustomListInvitation(listId, uid)

    if (!invitation) {
        throw new NotFoundError('Pending invitation not found')
    }

    const invitationRole = sanitizeCustomListMemberRole(invitation.role)
    const access = await assertCanManageListMembers(list, actor, {
        targetRole: invitationRole
    })

    await deleteCustomListInvitation(listId, uid)
    await touchCustomListActivity(listId)
    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: 'member_invitation_revoked',
        targetUid: uid,
        metadata: {
            role: invitationRole
        }
    })

    return getCustomList(listId, actor)
}

export async function updateCustomListMemberRole(listId: number, actor: CustomListActor, memberUid: unknown, roleValue: unknown) {
    const list = await getCustomListRow(listId)
    const uid = sanitizeActorUid(memberUid, 'member uid')
    const role = sanitizeCustomListMemberRole(roleValue)

    if (uid === list.owner) {
        throw new ValidationError('The owner role can only be changed through ownership transfer')
    }

    const existingMember = await getCustomListMembership(listId, uid)

    if (!existingMember) {
        throw new NotFoundError('Collaborator not found')
    }

    const access = await assertCanManageListMembers(list, actor, {
        targetRole: role,
        targetMember: existingMember
    })

    if (existingMember.role === role) {
        return getCustomList(listId, actor)
    }

    const updates: CustomListMemberUpdate = {
        role,
        updated_at: new Date().toISOString()
    }

    const { error } = await supabase
        .from('listMembers')
        .update(updates)
        .eq('listId', listId)
        .eq('uid', uid)

    if (error) {
        throw new Error(error.message)
    }

    await touchCustomListActivity(listId)
    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: 'member_role_updated',
        targetUid: uid,
        metadata: {
            fromRole: existingMember.role,
            toRole: role
        }
    })

    return getCustomList(listId, actor)
}

export async function removeCustomListMember(listId: number, actor: CustomListActor, memberUid: unknown) {
    const list = await getCustomListRow(listId)
    const uid = sanitizeActorUid(memberUid, 'member uid')

    if (uid === list.owner) {
        throw new ValidationError('The owner cannot be removed as a collaborator')
    }

    const existingMember = await getCustomListMembership(listId, uid)

    if (!existingMember) {
        throw new NotFoundError('Collaborator not found')
    }

    const access = await assertCanManageListMembers(list, actor, {
        targetMember: existingMember
    })

    const { error } = await supabase
        .from('listMembers')
        .delete()
        .eq('listId', listId)
        .eq('uid', uid)

    if (error) {
        throw new Error(error.message)
    }

    await touchCustomListActivity(listId)
    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: 'member_removed',
        targetUid: uid,
        metadata: {
            role: existingMember.role
        }
    })

    return getCustomList(listId, actor)
}

export async function transferCustomListOwnership(listId: number, actor: CustomListActor, targetUidValue: unknown) {
    const list = await getCustomListRow(listId)
    const access = await assertCanTransferListOwnership(list, actor)
    const targetUid = sanitizeActorUid(targetUidValue, 'owner uid')

    if (targetUid === list.owner) {
        throw new ValidationError('This player already owns the list')
    }

    await ensurePlayerExists(targetUid)

    const now = new Date().toISOString()
    const previousOwnerUid = list.owner

    const { error: removeTargetMembershipError } = await supabase
        .from('listMembers')
        .delete()
        .eq('listId', listId)
        .eq('uid', targetUid)

    if (removeTargetMembershipError) {
        throw new Error(removeTargetMembershipError.message)
    }

    const { error: updateOwnerError } = await supabase
        .from('lists')
        .update({
            owner: targetUid,
            updated_at: now
        })
        .eq('id', listId)

    if (updateOwnerError) {
        throw new Error(updateOwnerError.message)
    }

    const previousOwnerMembership: CustomListMemberInsert = {
        listId,
        uid: previousOwnerUid,
        role: 'admin',
        addedBy: previousOwnerUid,
        updated_at: now
    }

    const { error: upsertMembershipError } = await supabase
        .from('listMembers')
        .upsert(previousOwnerMembership, { onConflict: 'listId,uid' })

    if (upsertMembershipError) {
        throw new Error(upsertMembershipError.message)
    }

    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: 'ownership_transferred',
        targetUid,
        metadata: {
            previousOwnerUid
        }
    })

    return getCustomList(listId, actor)
}

export async function updateCustomListOfficialMetadata(listId: number, payload: {
    isOfficial?: unknown
    slug?: unknown
    weightFormula?: unknown
    recordScoreFormula?: unknown
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

    if (payload.recordScoreFormula !== undefined) {
        updates.recordScoreFormula = sanitizeRecordScoreFormula(payload.recordScoreFormula)
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
    await assertOwnerEditable(existing, ownerId)

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

export async function addLevelToCustomList(listId: number, ownerId: CustomListActor, levelId: number, options: {
    createdAt?: unknown
} = {}) {
    const list = await getCustomListRow(listId)
    const actorUid = getRequiredActorUid(ownerId)
    const access = await assertCanEditListLevels(list, ownerId)

    const level = await ensureLevelExists(levelId)
    assertLevelTypeMatchesList(list, level)

    const itemInsert: CustomListLevelInsert = {
        listId,
        levelId,
        addedBy: actorUid,
        minProgress: null,
        accepted: true
    }

    if (list.mode === 'top') {
        await ensureStoredTopPositions(listId)

        const { count, error: countError } = await supabase
            .from('listLevels')
            .select('id', { count: 'exact', head: true })
            .eq('listId', listId)

        if (countError) {
            throw new Error(countError.message)
        }

        itemInsert.position = (count ?? 0) + 1
    }

    if (options.createdAt !== undefined) {
        itemInsert.created_at = sanitizeListLevelCreatedAt(options.createdAt)
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
    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: 'level_added',
        metadata: {
            levelId
        }
    })

    return getCustomList(listId, ownerId)
}

export async function batchAddExistingLevelsToCustomList(listId: number, ownerId: CustomListActor, levelInputsInput: unknown) {
    const list = await getCustomListRow(listId)
    const actorUid = getRequiredActorUid(ownerId)
    const access = await assertCanEditListLevels(list, ownerId)
    const levelInputs = sanitizeBatchCustomListLevelInputs(levelInputsInput)

    if (!levelInputs.length) {
        return {
            added: 0,
            missingLevelIds: [] as number[],
            list: await getCustomList(listId, ownerId)
        }
    }

    const levelIds = levelInputs.map((levelInput) => levelInput.levelId)
    const { data: levels, error: levelsError } = await supabase
        .from('levels')
        .select('id, isPlatformer')
        .in('id', levelIds)

    if (levelsError) {
        throw new Error(levelsError.message)
    }

    const levelsById = new Map((levels || []).map((level) => [level.id, level]))
    const missingLevelIds = levelIds.filter((levelId) => !levelsById.has(levelId))

    for (const levelInput of levelInputs) {
        const level = levelsById.get(levelInput.levelId)

        if (!level) {
            continue
        }

        assertLevelTypeMatchesList(list, level)
    }

    const availableLevelIds = levelIds.filter((levelId) => levelsById.has(levelId))

    if (!availableLevelIds.length) {
        return {
            added: 0,
            missingLevelIds,
            list: await getCustomList(listId, ownerId)
        }
    }

    const { data: existingItems, error: existingItemsError } = await supabase
        .from('listLevels')
        .select('levelId')
        .eq('listId', listId)
        .in('levelId', availableLevelIds)

    if (existingItemsError) {
        throw new Error(existingItemsError.message)
    }

    const existingLevelIds = new Set((existingItems || []).map((item) => item.levelId))
    const insertInputs = levelInputs.filter((levelInput) => (
        levelsById.has(levelInput.levelId)
        && !existingLevelIds.has(levelInput.levelId)
    ))

    if (!insertInputs.length) {
        return {
            added: 0,
            missingLevelIds,
            list: await getCustomList(listId, ownerId)
        }
    }

    let nextPosition = 0

    if (list.mode === 'top') {
        await ensureStoredTopPositions(listId)

        const { count, error: countError } = await supabase
            .from('listLevels')
            .select('id', { count: 'exact', head: true })
            .eq('listId', listId)

        if (countError) {
            throw new Error(countError.message)
        }

        nextPosition = (count ?? 0) + 1
    }

    const itemInserts: CustomListLevelInsert[] = insertInputs.map((levelInput, index) => {
        const itemInsert: CustomListLevelInsert = {
            listId,
            levelId: levelInput.levelId,
            addedBy: actorUid,
            minProgress: null,
            accepted: true
        }

        if (list.mode === 'top') {
            itemInsert.position = nextPosition + index
        }

        if (levelInput.createdAt) {
            itemInsert.created_at = levelInput.createdAt
        }

        return itemInsert
    })

    const { error: insertError } = await supabase
        .from('listLevels')
        .insert(itemInserts)

    if (insertError) {
        if (insertError.code === '23505') {
            throw new ConflictError('One or more levels already exist in this list')
        }

        throw new Error(insertError.message)
    }

    await syncLevelCount(listId)

    for (const levelInput of insertInputs) {
        await appendCustomListAuditLog(listId, {
            actorUid: access.actorUid,
            action: 'level_added',
            metadata: {
                levelId: levelInput.levelId
            }
        })
    }

    return {
        added: insertInputs.length,
        missingLevelIds,
        list: await getCustomList(listId, ownerId)
    }
}

export async function removeLevelFromCustomList(listId: number, ownerId: CustomListActor, levelId: number) {
    const list = await getCustomListRow(listId)
    const access = await assertCanEditListLevels(list, ownerId)

    const { data, error } = await supabase
        .from('listLevels')
        .delete()
        .eq('listId', listId)
        .eq('levelId', levelId)
        .eq('accepted', true)
        .select('id')
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    if (!data) {
        throw new NotFoundError('Level is not in this list')
    }

    if (list.mode === 'top') {
        await ensureStoredTopPositions(listId)
    }

    await syncLevelCount(listId)
    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: 'level_removed',
        metadata: {
            levelId
        }
    })

    return getCustomList(listId, ownerId)
}

export async function updateListLevel(listId: number, ownerId: CustomListActor, levelId: number, patch: {
    rating?: unknown
    minProgress?: unknown
    videoID?: unknown
    videoId?: unknown
    createdAt?: unknown
    created_at?: unknown
}) {
    const list = await getCustomListRow(listId)
    const access = await assertCanEditListLevels(list, ownerId)

    const updates: Record<string, unknown> = {}

    if (patch.rating !== undefined) {
        updates.rating = sanitizeRating(patch.rating)
    }

    if (patch.minProgress !== undefined) {
        updates.minProgress = sanitizeMinProgress(patch.minProgress, list.isPlatformer)
    }

    const nextVideoID = patch.videoID !== undefined ? patch.videoID : patch.videoId

    if (nextVideoID !== undefined) {
        updates.videoID = sanitizeCustomListVideoId(nextVideoID)
    }

    const nextCreatedAt = patch.createdAt !== undefined ? patch.createdAt : patch.created_at

    if (nextCreatedAt !== undefined) {
        updates.created_at = sanitizeListLevelCreatedAt(nextCreatedAt)
    }

    if (!Object.keys(updates).length) {
        return getCustomList(listId, ownerId)
    }

    const { data, error } = await supabase
        .from('listLevels')
        .update(updates)
        .eq('listId', listId)
        .eq('levelId', levelId)
        .eq('accepted', true)
        .select('id')
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    if (!data) {
        throw new NotFoundError('Level is not in this list')
    }

    await touchCustomListActivity(listId)
    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: 'level_updated',
        metadata: {
            levelId,
            fields: Object.keys(updates)
        }
    })

    return getCustomList(listId, ownerId)
}

export async function reorderListLevels(listId: number, ownerId: CustomListActor, levelIds: unknown) {
    const list = await getCustomListRow(listId)
    const access = await assertCanEditListLevels(list, ownerId)

    if (list.mode !== 'top') {
        throw new ValidationError('Reordering is only available in top mode')
    }

    const sanitizedLevelIds = sanitizeLevelReorderIds(levelIds)

    await applyCustomListLevelOrder(listId, sanitizedLevelIds)

    await touchCustomListActivity(listId)
    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: 'levels_reordered',
        metadata: {
            levelIds: sanitizedLevelIds
        }
    })

    return getCustomList(listId, ownerId)
}
