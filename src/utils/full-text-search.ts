export const FULL_TEXT_SEARCH_CONFIG = 'simple'

export const FULL_TEXT_SEARCH_METHODS = [
    'tsquery',
    'plain',
    'phrase',
    'websearch',
    'prefix'
] as const

export type FullTextSearchMethod = (typeof FULL_TEXT_SEARCH_METHODS)[number]

type FullTextSearchType = 'plain' | 'phrase' | 'websearch'

export function normalizeFullTextSearchQuery(query?: string | null) {
    if (typeof query !== 'string') {
        return ''
    }

    return query.trim().replace(/\s+/g, ' ')
}

export function resolveFullTextSearchMethod(method?: string | null): FullTextSearchMethod {
    switch (method?.trim().toLowerCase()) {
        case 'plain':
            return 'plain'
        case 'phrase':
            return 'phrase'
        case 'prefix':
            return 'prefix'
        case 'tsquery':
        case 'raw':
            return 'tsquery'
        case 'websearch':
        default:
            return 'websearch'
    }
}

function sanitizePrefixToken(token: string) {
    return token.replace(/[&|!():<>']/g, '').trim()
}

function buildPrefixTextSearchQuery(query?: string | null) {
    const normalizedQuery = normalizeFullTextSearchQuery(query).replace(/\+/g, ' ')

    if (!normalizedQuery.length) {
        return ''
    }

    return normalizedQuery
        .split(' ')
        .map(sanitizePrefixToken)
        .filter(Boolean)
        .map((token) => `${token}:*`)
        .join(' & ')
}

export function buildFullTextSearchParams(query?: string | null, methodInput?: string | null, config = FULL_TEXT_SEARCH_CONFIG) {
    const method = resolveFullTextSearchMethod(methodInput)

    if (method === 'prefix') {
        const prefixQuery = buildPrefixTextSearchQuery(query)

        if (!prefixQuery.length) {
            return null
        }

        return {
            query: prefixQuery,
            options: { config }
        }
    }

    const normalizedQuery = normalizeFullTextSearchQuery(query)

    if (!normalizedQuery.length) {
        return null
    }

    if (method === 'tsquery') {
        return {
            query: normalizedQuery,
            options: { config }
        }
    }

    return {
        query: normalizedQuery,
        options: {
            config,
            type: method as FullTextSearchType
        }
    }
}

export function mergeUniqueById<T extends { id: number }>(...collections: Array<T[] | null | undefined>) {
    const merged = new Map<number, T>()

    for (const collection of collections) {
        if (!collection) {
            continue
        }

        for (const entry of collection) {
            if (!merged.has(entry.id)) {
                merged.set(entry.id, entry)
            }
        }
    }

    return [...merged.values()]
}
