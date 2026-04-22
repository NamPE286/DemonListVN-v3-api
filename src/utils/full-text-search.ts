export function normalizeFullTextSearchQuery(query?: string | null) {
    if (typeof query !== 'string') {
        return ''
    }

    return query.trim().replace(/\s+/g, ' ')
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
