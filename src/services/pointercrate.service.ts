const POINTERCRATE_API_BASE_URL = 'https://pointercrate.com/api/v2/'
const POINTERCRATE_LISTED_DEMONS_PATH = 'demons/listed'

export const POINTERCRATE_LISTED_DEMONS_DEFAULT_LIMIT = 25
export const POINTERCRATE_LISTED_DEMONS_MAX_LIMIT = 100

type PointercrateRecord = Record<string, unknown>

export type PointercratePerson = {
    id: number
    name: string
    banned: boolean
}

export type PointercrateListedDemon = {
    id: number
    position: number
    name: string
    requirement: number | null
    video: string | null
    thumbnail: string | null
    publisher: PointercratePerson
    verifier: PointercratePerson
    level_id: number
}

export type PointercrateListedDemonsPage = {
    demons: PointercrateListedDemon[]
    after: number
    limit: number
    nextAfter: number | null
    hasMore: boolean
}

function isRecord(value: unknown): value is PointercrateRecord {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function normalizePointercrateCursor(value: unknown) {
    if (value == null || value === '') {
        return 0
    }

    const parsed = Number(value)

    if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error('Pointercrate cursor must be a non-negative integer')
    }

    return parsed
}

export function normalizePointercrateListedDemonsLimit(value: unknown) {
    if (value == null || value === '') {
        return POINTERCRATE_LISTED_DEMONS_DEFAULT_LIMIT
    }

    const parsed = Number(value)

    if (!Number.isInteger(parsed) || parsed < 1 || parsed > POINTERCRATE_LISTED_DEMONS_MAX_LIMIT) {
        throw new Error(`Pointercrate page limit must be between 1 and ${POINTERCRATE_LISTED_DEMONS_MAX_LIMIT}`)
    }

    return parsed
}

function normalizePointercratePerson(value: unknown): PointercratePerson {
    const source = isRecord(value) ? value : {}
    const id = Number(source.id)

    return {
        id: Number.isInteger(id) && id > 0 ? id : 0,
        name: typeof source.name === 'string' && source.name.trim().length ? source.name.trim() : 'Unknown',
        banned: Boolean(source.banned)
    }
}

function normalizeOptionalString(value: unknown) {
    return typeof value === 'string' && value.trim().length ? value.trim() : null
}

function normalizePointercrateListedDemon(value: unknown): PointercrateListedDemon | null {
    if (!isRecord(value)) {
        return null
    }

    const id = Number(value.id)
    const position = Number(value.position)
    const levelId = Number(value.level_id)
    const requirement = value.requirement == null ? null : Number(value.requirement)

    if (!Number.isInteger(id) || id <= 0) {
        return null
    }

    if (!Number.isInteger(position) || position <= 0) {
        return null
    }

    if (!Number.isInteger(levelId) || levelId <= 0) {
        return null
    }

    if (requirement !== null && (!Number.isFinite(requirement) || requirement < 0)) {
        return null
    }

    return {
        id,
        position,
        name: typeof value.name === 'string' && value.name.trim().length ? value.name.trim() : `Pointercrate demon #${id}`,
        requirement,
        video: normalizeOptionalString(value.video),
        thumbnail: normalizeOptionalString(value.thumbnail),
        publisher: normalizePointercratePerson(value.publisher),
        verifier: normalizePointercratePerson(value.verifier),
        level_id: levelId
    }
}

export async function fetchPointercrateListedDemonsPage(options: {
    after?: unknown
    limit?: unknown
} = {}): Promise<PointercrateListedDemonsPage> {
    const after = normalizePointercrateCursor(options.after)
    const limit = normalizePointercrateListedDemonsLimit(options.limit)
    const url = new URL(POINTERCRATE_LISTED_DEMONS_PATH, POINTERCRATE_API_BASE_URL)
    url.searchParams.set('limit', String(limit))
    url.searchParams.set('after', String(after))

    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
            'User-Agent': 'gdvn-pointercrate-mirror-crawler'
        }
    })

    if (!response.ok) {
        throw new Error(`Pointercrate responded with ${response.status}`)
    }

    const payload = await response.json()

    if (!Array.isArray(payload)) {
        throw new Error('Pointercrate listed demons response must be an array')
    }

    const demons = payload.map(normalizePointercrateListedDemon)

    if (demons.some((demon) => demon === null)) {
        throw new Error('Pointercrate listed demons response contained an invalid demon row')
    }

    const normalizedDemons = demons as PointercrateListedDemon[]
    const lastPosition = normalizedDemons.at(-1)?.position ?? after

    return {
        demons: normalizedDemons,
        after,
        limit,
        nextAfter: normalizedDemons.length === limit ? lastPosition : null,
        hasMore: normalizedDemons.length === limit
    }
}

export async function getUsernameByToken(token: string): Promise<string> {
    const res: any = await (await fetch('https://pointercrate.com/api/v1/auth/me/', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })).json();

    return res.data.name;
}

export async function hasRecord(id: number, levelName: string) {
    try {
        const res: any = await (await fetch(`https://pointercrate.com/api/v1/records?player=${id}&demon=${levelName}`)).json();

        for (const record of res) {
            if (record.status == "approved") {
                return true;
            }
        }

        return false;
    } catch {
        console.error("Failed to fetch from Pointercrate")
        return false;
    }
}

export async function approved(name: string, levelName: string) {
    const response = await fetch(`https://pointercrate.com/api/v1/players?name=${name}`);
    
    if (!response.ok) {
        throw response.status;
    }
    
    const res: any = await response.json();

    for (const i of res) {
        if (await hasRecord(i.id, levelName)) {
            return true;
        }
    }

    return false;
}