import supabase from '@src/client/supabase'
import { getActiveseason, addXp } from '@src/services/battlepass.service'

const AD_DAILY_CHECKIN_XP = 25
const AD_DAILY_CHECKIN_SOURCE = 'ad_daily_checkin'

function getTodayStartUTC(): Date {
    // UTC+7: day starts at 17:00 UTC the previous day
    const now = new Date()
    const utc7Offset = 7 * 60 * 60 * 1000
    const nowUTC7 = new Date(now.getTime() + utc7Offset)
    const todayUTC7 = new Date(Date.UTC(
        nowUTC7.getUTCFullYear(),
        nowUTC7.getUTCMonth(),
        nowUTC7.getUTCDate()
    ))
    // Convert back to UTC
    return new Date(todayUTC7.getTime() - utc7Offset)
}

async function hasClaimedToday(userId: string): Promise<boolean> {
    const todayStart = getTodayStartUTC()

    const { data, error } = await supabase
        .from('battlePassXPLogs')
        .select('id')
        .eq('userID', userId)
        .eq('source', AD_DAILY_CHECKIN_SOURCE)
        .gte('created_at', todayStart.toISOString())
        .limit(1)
        .maybeSingle()

    if (error) throw new Error(error.message)

    return !!data
}

export async function getDailyCheckinStatus(userId: string) {
    const claimed = await hasClaimedToday(userId)
    return { claimed, xp: AD_DAILY_CHECKIN_XP }
}

export async function confirmDailyCheckinReward(userId: string) {
    const season = await getActiveseason()
    if (!season) {
        throw Object.assign(new Error('No active season'), { statusCode: 404 })
    }

    const alreadyClaimed = await hasClaimedToday(userId)
    if (alreadyClaimed) {
        throw Object.assign(new Error('Already claimed today'), { statusCode: 400 })
    }

    const result = await addXp(season.id, userId, AD_DAILY_CHECKIN_XP, AD_DAILY_CHECKIN_SOURCE)

    return { xp: AD_DAILY_CHECKIN_XP, ...result }
}
