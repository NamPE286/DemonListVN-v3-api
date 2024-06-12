import supabase from "@src/database/supabase"
import Player from "@src/lib/classes/Player"

export async function getDemonListLeaderboard({ start = 0, end = 50, sortBy = 'overallRank', ascending = true } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const { data, error } = await supabase
        .from('players, clans!id(*)')
        .select('*')
        .not('overallRank', 'is', null)
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