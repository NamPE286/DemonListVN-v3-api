import supabase from "@src/database/supabase"
import Player from "@src/lib/classes/Player"

export async function getFeaturedListLeaderboard({ start = 0, end = 50, sortBy = 'flrank', ascending = true } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const { data, error } = await supabase
        .from('players')
        .select('*, clans!id(*)')
        .not('flrank', 'is', null)
        .eq('isHidden', false)
        .order(sortBy, { ascending: ascending })
        .range(start, end)

    if (error) {
        throw error
    }

    const levels: Player[] = []

    for (const i of data) {
        levels.push(new Player(i))
    }

    return levels
}