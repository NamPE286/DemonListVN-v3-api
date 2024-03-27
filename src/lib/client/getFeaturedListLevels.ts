import supabase from "@src/database/supabase"
import Level from "@src/lib/classes/Level"

export async function getFeaturedListLevels({ start = 0, end = 50, sortBy = 'flTop', ascending = true } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const { data, error } = await supabase
        .from('levels')
        .select('*')
        .not('flTop', 'is', null)
        .order(sortBy, { ascending: ascending })
        .range(start, end)

    if (error) {
        throw error
    }

    const levels: Level[] = []

    for (const i of data) {
        levels.push(new Level(i))
    }

    return levels
}