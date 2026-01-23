import supabase from "@src/client/supabase";
import { fetchLevelFromGD } from "@src/services/level.service";

async function fetchPlayerData(uid: string, levelID: number) {
    let { data, error } = await supabase
        .from('deathCount')
        .select('*')
        .eq('uid', uid)
        .eq('levelID', levelID)
        .limit(1)
        .single()

    if (data == null) {
        return { uid: uid, levelID: levelID, count: Array(100).fill(0), completedTime: null }
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

async function isEligible(levelID: number): Promise<boolean> {
    const now = new Date();
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

    const data = await fetchLevelFromGD(levelID)

    if (data.difficulty == 'Extreme Demon' || data.difficulty == 'Insane Demon') {
        return true;
    }

    return false;
}

export async function getDeathCount(uid: string, levelID: number) {
    return await fetchPlayerData(uid, levelID)
}

export async function getLevelDeathCount(id: number) {
    return await fetchLevelData(id);
}

export async function updateDeathCount(uid: string, levelID: number, arr: number[], setCompleted?: boolean) {
    if (!(await isEligible(levelID))) {
        throw new Error();
    }

    const player = await fetchPlayerData(uid, levelID)
    const level = await fetchLevelData(levelID)
    
    for (let i = 0; i < 100; i++) {
        player.count[i] += arr[i];
        level.count[i] += arr[i];
    }

    if (setCompleted && !player.completedTime) {
        player.completedTime = new Date().toISOString();
    }

    await supabase
        .from('deathCount')
        .upsert(player)

    await supabase
        .from('levelDeathCount')
        .upsert(level)

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
            maxProgress = i + 1; // +1 because if you died at 99%, you reached 99%
        }
    }
    return Math.min(maxProgress, 99); // Cap at 99% since 100% means completed
}