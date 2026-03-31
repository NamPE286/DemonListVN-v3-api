import express from 'express'
import { getOngoingEvents } from '@src/services/event.service'
import { getTopBuyers, getSupporterRevenueProgress } from '@src/services/player.service'
import { getClans } from '@src/services/clan.service'
import { getCommunityPosts } from '@src/services/community.service'
import { getPlayerProgress, hasBattlePassPremium } from '@src/services/battlepass.service'
import optionalUserAuth from '@src/middleware/optional-user-auth.middleware'
import supabase from '@src/client/supabase'

const router = express.Router()

let cachedHomepageData: any = null
let homepageDataFetchTime: number = 0
const CACHE_TTL = 300000 // 5 minutes

router.route('/')
    .get(optionalUserAuth, async (req, res) => {
        try {
            const now = Date.now()
            let publicData: any = null

            if (cachedHomepageData && (now - homepageDataFetchTime < CACHE_TTL)) {
                publicData = cachedHomepageData
            } else {
                const [
                    events,
                    topSupporters,
                    serverProgress,
                    topClans,
                    communityPosts,
                    dlLevels,
                    flLevels,
                    plLevels,
                    clLevels,
                    activeSeason
                ] = await Promise.all([
                    getOngoingEvents().catch(() => []),
                    getTopBuyers(2592000000, 3, 0).catch(() => []),
                    getSupporterRevenueProgress(2592000000).catch(() => ({ serverCostPercent: 0, minecraftServerPercent: 0 })),
                    getClans({ start: 0, end: 4, sortBy: 'memberCount', ascending: 'false' }).catch(() => []),
                    getCommunityPosts({ limit: 3, offset: 0, sortBy: 'createdAt', ascending: false, clanId: null }).catch(() => []),
                    fetchLevels('dl'),
                    fetchLevels('fl'),
                    fetchLevels('pl'),
                    fetchLevels('cl'),
                    fetchActiveSeason()
                ])

                publicData = {
                    events,
                    topSupporters,
                    serverProgress,
                    topClans,
                    communityPosts,
                    levels: {
                        dl: dlLevels,
                        fl: flLevels,
                        pl: plLevels,
                        cl: clLevels
                    },
                    activeSeason
                }
                cachedHomepageData = publicData
                homepageDataFetchTime = now
            }

            // If user is authenticated and there's an active season, fetch their BP progress
            let battlepassProgress = null
            if (res.locals.authenticated && res.locals.user && publicData.activeSeason) {
                try {
                    battlepassProgress = await getPlayerProgress(publicData.activeSeason.id, res.locals.user.uid!)
                } catch {}
            }

            res.send({
                ...publicData,
                battlepassProgress
            })
        } catch (err) {
            console.error('Homepage data error:', err)
            res.status(500).send()
        }
    })

async function fetchLevels(list: string) {
    let query = supabase
        .from('levels')
        .select('*, levels_tags(level_tags(*))')
        .not(list === 'fl' ? 'flTop' : 'dlTop', 'is', null)
        .order('created_at', { ascending: false })
        .range(0, 9)

    if (list === 'cl') {
        query = query.eq('isChallenge', true)
    } else if (list === 'pl') {
        query = query.eq('isPlatformer', true).eq('isChallenge', false)
    } else if (list === 'dl') {
        query = query.eq('isPlatformer', false).eq('isChallenge', false)
    }

    const { data, error } = await query

    if (error) return []

    return data
}

async function fetchActiveSeason() {
    const now = new Date().toISOString()

    const { data } = await supabase
        .from('battlePassSeasons')
        .select('id, title, start, end, primaryColor, isArchived')
        .lte('start', now)
        .gte('end', now)
        .eq('isArchived', false)
        .order('start', { ascending: false })
        .limit(1)
        .maybeSingle()

    return data
}

export default router
