import supabase from "@src/client/supabase"

/**
 * Check if a level is in an active battle pass season
 * (in battlePassLevels or battlePassMapPacks)
 */
export async function isLevelInActiveBattlePassSeason(levelID: number): Promise<boolean> {
    const now = new Date().toISOString()

    // Check if level is in battlePassLevels of an active season
    const { data: levelData, error: levelError } = await (supabase as any)
        .from('battlePassLevels')
        .select('*, battlePassSeasons!inner(*)')
        .eq('levelID', levelID)
        .lte('battlePassSeasons.start', now)

    if (levelError) {
        console.error('Error checking battlePassLevels:', levelError)
    }

    if (levelData && levelData.length > 0) {
        // Check if any season is currently active (started and not ended, or no end date)
        for (const entry of levelData) {
            const season = entry.battlePassSeasons
            if (!season.end || new Date(season.end) >= new Date()) {
                return true
            }
        }
    }

    // Check if level is in a map pack that's in an active battle pass season
    const { data: mapPackData, error: mapPackError } = await (supabase as any)
        .from('battlePassMapPacks')
        .select('*, battlePassSeasons!inner(*), mapPackLevels!inner(levelID)')
        .eq('mapPackLevels.levelID', levelID)
        .lte('battlePassSeasons.start', now)

    if (mapPackError) {
        console.error('Error checking battlePassMapPacks:', mapPackError)
    }

    if (mapPackData && mapPackData.length > 0) {
        for (const entry of mapPackData) {
            const season = entry.battlePassSeasons
            if (!season.end || new Date(season.end) >= new Date()) {
                return true
            }
        }
    }

    return false
}

/**
 * Get the active battle pass season
 */
export async function getActiveBattlePassSeason() {
    const now = new Date().toISOString()

    const { data, error } = await (supabase as any)
        .from('battlePassSeasons')
        .select('*')
        .lte('start', now)
        .or(`end.is.null,end.gte.${now}`)
        .order('start', { ascending: false })
        .limit(1)
        .single()

    if (error) {
        return null
    }

    return data
}

/**
 * Get all levels in the active battle pass season
 */
export async function getActiveBattlePassLevels() {
    const season = await getActiveBattlePassSeason()
    if (!season) {
        return []
    }

    const { data, error } = await (supabase as any)
        .from('battlePassLevels')
        .select('*, levels(*)')
        .eq('seasonID', season.id)

    if (error) {
        console.error('Error fetching battle pass levels:', error)
        return []
    }

    return data || []
}

/**
 * Get all map packs in the active battle pass season
 */
export async function getActiveBattlePassMapPacks() {
    const season = await getActiveBattlePassSeason()
    if (!season) {
        return []
    }

    const { data, error } = await (supabase as any)
        .from('battlePassMapPacks')
        .select('*')
        .eq('seasonID', season.id)

    if (error) {
        console.error('Error fetching battle pass map packs:', error)
        return []
    }

    return data || []
}

/**
 * Update battle pass level progress when completing a level
 * This is called from the death count endpoint when a level is completed
 */
export async function updateBattlePassLevelProgress(uid: string, levelID: number, progress: number): Promise<void> {
    const isInBattlePass = await isLevelInActiveBattlePassSeason(levelID)
    
    if (!isInBattlePass) {
        return
    }

    const season = await getActiveBattlePassSeason()
    if (!season) {
        return
    }

    // Upsert progress record for this level in the battle pass
    const { error } = await (supabase as any)
        .from('battlePassProgress')
        .upsert({
            uid,
            levelID,
            seasonID: season.id,
            progress,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'uid,levelID,seasonID'
        })

    if (error) {
        console.error('Error updating battle pass progress:', error)
    }
}
