import supabase from "@src/database/supabase";
import Level from "@src/lib/classes/Level";

async function fetchPlayerData(uid: string, levelID: number): Promise<any> {
    let { data, error } = await supabase
        .from('deathCount')
        .select('*')
        .eq('uid', uid)
        .eq('levelID', levelID)
        .limit(1)
        .single()

    if (data == null) {
        return { uid: uid, levelID: levelID, count: Array(100).fill(0) }
    }

    return data
}

async function fetchLevelData(levelID: number): Promise<any> {
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
    const level = new Level({ id: levelID })
    const data = await level.fetchFromGD()
    const now = new Date();

    if (data.difficulty == 'Extreme Demon' || data.difficulty == 'Insane Demon') {
        return true;
    }

    const a = await supabase
        .from('eventLevels')
        .select('*, events(*)')
        .eq('levelID', levelID)

    if (a.error) {
        return false;
    }

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

    return false;
}

export async function getDeathCount(uid: string, levelID: number) {
    return await fetchPlayerData(uid, levelID)
}

export async function getLevelDeathCount(id: number) {
    return await fetchLevelData(id);
}

export async function updateDeathCount(uid: string, levelID: number, arr: number[]) {
    if (!(await isEligible(levelID))) {
        throw new Error();
    }

    const player = await fetchPlayerData(uid, levelID)
    const level = await fetchLevelData(levelID)

    for (let i = 0; i < 100; i++) {
        player.count[i] += arr[i];
        level.count[i] += arr[i];
    }

    await supabase
        .from('deathCount')
        .upsert(player)

    await supabase
        .from('levelDeathCount')
        .upsert(level)
}