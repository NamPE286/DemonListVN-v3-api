import supabase from "@src/database/supabase"
import Level from "@src/lib/classes/Level"

export async function getDemonListLevels({ start = 0, end = 50, sortBy = 'dlTop', ascending = true } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const { data, error } = await supabase
        .from('levels')
        .select('*')
        .not('dlTop', 'is', null)
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