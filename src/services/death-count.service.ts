import supabase from "@src/client/supabase";
import { fetchLevelFromGD } from "@src/services/level.service";
import { getActiveseason, getActiveBattlePassLevelByLevelID, getAllSeasonMapPacks } from "@src/services/battlepass.service";

export async function fetchPlayerDeathCount(uid: string, levelID: number, tag: string) {
    let { data, error } = await supabase
        .from('deathCount')
        .select('*')
        .match({ uid, levelID, tag })
        .limit(1)
        .single()

    if (data == null) {
        return {
            uid: uid,
            levelID: levelID,
            tag,
            count: Array(100).fill(0) as number[],
            completedTime: null as string | null
        }
    }

    return data
}

async function fetchLevelData(levelID: number) {
    let { data, error } = await supabase
        .from('levelDeathCount')
        .select('*')
        .eq('levelID', levelID)
        .limit(1)
        .single()

    if (data == null) {
        return { levelID: levelID, count: Array(100).fill(0) }
    }

    return data
}

async function isEligible(levelID: number, eventCheck = true, battlepassCheck = false): Promise<boolean> {
    const now = new Date();

    if (eventCheck) {
        // Check if level is part of an active event
        const a = await supabase
            .from('eventLevels')
            .select('*, events(*)')
            .eq('levelID', levelID)

        if (!a.error) {
            for (const lv of a.data) {
                if (!lv.events) {
                    continue
                }

                const { start, end } = lv.events

                if (!end) {
                    const startDate = new Date(start);

                    if (now >= startDate) {
                        return true;
                    }
                } else {
                    const startDate = new Date(start);
                    const endDate = new Date(end);

                    if (now >= startDate && now <= endDate) {
                        return true;
                    }
                }
            }
        }
    }

    if (battlepassCheck) {
        try {
            // Check if level is part of an active season (normal, daily, weekly, or map pack)
            const activeSeason = await getActiveseason();

            if (activeSeason) {
                // Check if level is a battle pass level (normal, daily, weekly)

                try {
                    const battlePassLevel = await getActiveBattlePassLevelByLevelID(levelID);

                    if (battlePassLevel) {
                        return true;
                    }
                } catch { }

                // Check if level is in a map pack for this season
                const seasonMapPacks = await getAllSeasonMapPacks(activeSeason.id);

                for (const bpMapPack of seasonMapPacks) {
                    if (bpMapPack.mapPacks?.mapPackLevels) {
                        const hasLevel = bpMapPack.mapPacks.mapPackLevels.some((mpl: any) => mpl.levelID === levelID);
                        if (hasLevel) {
                            return true;
                        }
                    }
                }
            }
        } catch { }
    }

    // Check if level is Extreme Demon or Insane Demon
    const data = await fetchLevelFromGD(levelID)

    if (data.difficulty == 'Extreme Demon' || data.difficulty == 'Insane Demon') {
        return true;
    }

    return false;
}

export async function getDeathCount(uid: string, levelID: number, tag: string) {
    return await fetchPlayerDeathCount(uid, levelID, tag)
}

export async function getLevelDeathCount(id: number) {
    return await fetchLevelData(id);
}

export async function updateDeathCount(uid: string, levelID: number, tag: string, arr: number[], setCompleted?: boolean) {
    // TODO: event tag

    const isBattlepass = tag.startsWith('battlepass');

    if (!(await isEligible(levelID, !isBattlepass, isBattlepass))) {
        throw new Error("Not eligible");
    }

    const player = await fetchPlayerDeathCount(uid, levelID, tag)
    const level = await fetchLevelData(levelID)

    for (let i = 0; i < 100; i++) {
        player.count[i] += arr[i];
        level.count[i] += arr[i];
    }

    if (setCompleted && !player.completedTime) {
        player.completedTime = new Date().toISOString();
    }

    const { error: deathCountError } = await supabase
        .from('deathCount')
        .upsert(player)

    if (deathCountError) {
        throw new Error(deathCountError.message)
    }

    if (!isBattlepass) {
        const { error: levelDeathCountError } = await supabase
            .from('levelDeathCount')
            .upsert(level)

        if (levelDeathCountError) {
            throw new Error(levelDeathCountError.message)
        }
    }

    return player;
}

/**
 * Calculate progress percentage based on death count array.
 * The death count array contains death counts at each percentage from 0-99.
 * Progress is calculated as the highest percentage where a death has been recorded.
 */
export function getDeathCountProgress(arr: number[]): number {
    // Find the highest index (percentage) where the player has died
    let maxProgress = 0;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] > 0) {
            maxProgress = i; // +1 because if you died at 99%, you reached 99%
        }
    }
    return Math.min(maxProgress, 99); // Cap at 99% since 100% means completed
}